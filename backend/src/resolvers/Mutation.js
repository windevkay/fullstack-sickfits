const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {randomBytes} = require('crypto');
const {promisify} = require('util');
const {transport, makeANiceEmail} = require('../mail');
const {hasPermission} = require('../utils');
const stripe = require('../stripe');
require('dotenv').config({path:'variables.env'});

const Mutations = {
    createItem: async (parent, args, ctx, info) => {
        if(!ctx.request.userId){
            throw new Error('You need to be logged in for this action');
        }

        try{
            const item = await ctx.db.mutation.createItem({
                //creating relationship here between item and logged in user
                data:{...args,
                    user: {connect: {id: ctx.request.userId}}
                }}, info);
            return item;
        }catch(error){
            throw new Error(error);
        }
    },

    updateItem: async (parent, args, ctx, info) => {
        //take a copy of the update
        const updates = {...args};
        //we shouldnt update the ID so delete it from the updates 
        delete updates.id;
        //run the update method 
        try{
            return await ctx.db.mutation.updateItem({
                data: updates,
                where:{id: args.id}
            }, info);
        }catch(error){
            throw new Error(error);
        }
    },

    deleteItem: async (parent, args, ctx, info) => {
        //find the item, check if user has permissions to the item, delete the item
        try{
            // 1. find the item
            const item = await ctx.db.query.item(args, `{ id title user { id }}`);
            // 2. Check if they own that item, or have the permissions
            const ownsItem = item.user.id === ctx.request.userId;
            const hasPermissions = ctx.request.user.permissions.some(permission =>
            ['ADMIN', 'ITEMDELETE'].includes(permission)
            );

            if (!ownsItem && !hasPermissions) {
            throw new Error("You don't have permission to do that!");
            }
            // 3. Delete it!
            return ctx.db.mutation.deleteItem(args, info);
        }catch(error){
            throw new Error(error);
        }
    },

    signup: async (parent, args, ctx, info) => {
        try{
            //convert user email address to lowercase 
            args.email = args.email.toLowerCase();
            //hash the users password
            const password = await bcrypt.hash(args.password, 10);
            //create the user in the db 
            const user = await ctx.db.mutation.createUser({
                data: {...args, 
                        password,
                        permissions: {set:['USER']}
                    }
            }, info);
            //create the jwt token for the user 
            const token = jwt.sign({userId: user.id}, process.env.APP_SECRET);
            //set the jwt token as a cookie on the response 
            ctx.response.cookie('token', token, {
            httpOnly: true, //this blocks random javascript from access to the cookie 
            maxAge: 1000 * 60 * 60 * 24 * 365 //1 year cookie expiry
            });
            //now return the user
            return user;
        }catch(error){
            throw new Error(error);
        }
    },

    signin: async (parent, {email, password}, ctx, info) => {
        try{
            //check if there is a user with that email 
            const user = await ctx.db.query.user({where: {email}});
            if(!user){
                throw new Error(`No user found with email: ${email}`);
            }
            //check if the entered password is correct 
            const valid = bcrypt.compare(password, user.password);
            if(!valid){
                throw new Error('Invalid password provided');
            }
            //generate the jwt token 
            const token = jwt.sign({userId: user.id}, process.env.APP_SECRET);
            //set the cookie with the token 
            ctx.response.cookie('token', token, {
                httpOnly: true, //this blocks random javascript from access to the cookie 
                maxAge: 1000 * 60 * 60 * 24 * 365 //1 year cookie expiry
                });
            //return the user
            return user;
        }catch(error){
            throw new Error(error);
        }
    },

    signout: (parent, args, ctx, info) => {
        try{
            ctx.response.clearCookie('token');
            return {message: 'SIGNED OUT SUCCESSFULLY'}
        }catch(error){
            throw new Error(error);
        }
    },

    requestReset: async (parent, args, ctx, info) => {
        try{
            //check if this is a real user
            const user = await ctx.db.query.user({where: {email: args.email}});
            if(!user){
                throw new Error(`No user found for email: ${args.email}`);
            }
            //set a reset token and expiry
            const resetToken = (await promisify(randomBytes)(20)).toString('hex');
            const resetTokenExpiry = Date.now() + 3600000; //set expiry to one hour
            const res = await ctx.db.mutation.updateUser({
                where: {email: args.email},
                data: {resetToken, resetTokenExpiry}
            });
            //email the user that reset token
            const mailRes = await transport.sendMail({
                from: 'noreply@sickfits.com',
                to: user.email,
                subject: 'Password reset token',
                html: makeANiceEmail(`Your password token \n\n 
                <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">
                Click here</a>`)
            });
            //return message
            return {message: 'RESET TOKEN GENERATED SUCCESSFULLY'}
        }catch(error){
            throw new Error(error);
        }
    },

    resetPassword: async (parent, args, ctx, info) => {
        try{
            //check that the passwords match
            if(args.password !== args.confirmPassword){
                throw new Error("Your passwords do not match!");
            }
            //check if the reset token is valid
            //check if the token is expired
            const [user] = await ctx.db.query.users({
                where: {
                    resetToken: args.resetToken,
                    resetTokenExpiry_gte: Date.now() - 3600000
                }
            });
            
            if(!user){
                throw new Error('This token is either invalid or expired');
            }
            //hash the users new password
            const password = await bcrypt.hash(args.password, 10);
            //save the new password to the user and remove reset token fields
            const updatedUser = await ctx.db.mutation.updateUser({
                where:{email: user.email},
                data:{
                    password,
                    resetToken: null,
                    resetTokenExpiry: null
                }
            });
            //generate jwt 
            const token = jwt.sign({userId: updatedUser.id}, process.env.APP_SECRET);
            //set the jwt cookie
            ctx.response.cookie('token', token, {
                httpOnly: true, //this blocks random javascript from access to the cookie 
                maxAge: 1000 * 60 * 60 * 24 * 365 //1 year cookie expiry
            });
            //return the user
            return updatedUser;
        }catch(error){
            throw new Error(error);
        }
    },

    updatePermissions: async (parent, args, ctx, info) => {
        try{
            //check if user is logged in
            if(!ctx.request.userId){
                throw new Error('You need to be logged in for this action');
            }
            //get the current user
            const user = await ctx.db.query.user({where: {id: ctx.request.userId}}, info);
            //check if they have permissions to update a permission
            hasPermission(user, ['ADMIN','PERMISSIONUPDATE']);
            //update the permission
            return await ctx.db.mutation.updateUser({
                data: {permissions: {set: args.permissions}},
                where: {id: args.userId}
            }, info)
        }catch(error){
            throw new Error(error);
        }
    },

    addToCart: async (parent, args, ctx, info) => {
        try{
            //make sure user is signed in
            const userId = ctx.request.userId;
            if(!userId){
                throw new Error('You need to be logged in for this action');
            }
            //query their cart items
            const [existingItem] = await ctx.db.query.cartItems({
                where: {
                    user: {id: userId},
                    item: {id: args.id}
                }
            });
            //check if item is already in their cart, if yes increment by 1
            if(existingItem){
                return await ctx.db.mutation.updateCartItem({
                    where: {id: existingItem.id},
                    data: {quantity: existingItem.quantity + 1}
                }, info);
            }
            //if not, create a fresh cart item 
            return await ctx.db.mutation.createCartItem({
                data: {
                    user: {
                        connect: {id: userId}
                    },
                    item: {
                        connect: {id: args.id}
                    }
                }
            }, info);
        }catch(error){
            throw new Error(error);
        }
    },

    removeFromCart: async (parent, args, ctx, info) => {
        try{
            //find the cart item
            const cartItem = await ctx.db.query.cartItem({where: {id: args.id}}, `{id, user{ id }}`);
            if(!cartItem) throw new Error("No cart item found...");
            //ensure they own that cart item
            if(cartItem.user.id !== ctx.request.userId) throw new Error("You cannot delete this item..");
            //delete the item
            return await ctx.db.mutation.deleteCartItem({where: {id: args.id}}, info);
        }catch(error){
            throw new Error(error);
        }
    },

    createOrder: async (parent, args, ctx, info) => {
        try{
            // 1. Query the current user and make sure they are signed in
            const { userId } = ctx.request;
            if (!userId) throw new Error('You must be signed in to complete this order.');
            const user = await ctx.db.query.user(
            { where: { id: userId } },
            `{
            id
            name
            email
            cart {
                id
                quantity
                item { title price id description image largeImage }
            }}`
            );
            // 2. recalculate the total for the price
            const amount = user.cart.reduce(
            (tally, cartItem) => tally + cartItem.item.price * cartItem.quantity,
            0
            );
            // 3. Create the stripe charge (turn token into $$$)
            const charge = await stripe.charges.create({
            amount,
            currency: 'USD',
            source: args.token,
            });
            // 4. Convert the CartItems to OrderItems
            const orderItems = user.cart.map(cartItem => {
            const orderItem = {
                ...cartItem.item,
                quantity: cartItem.quantity,
                user: { connect: { id: userId } },
            };
            delete orderItem.id;
            return orderItem;
            });

            // 5. create the Order
            const order = await ctx.db.mutation.createOrder({
            data: {
                total: charge.amount,
                charge: charge.id,
                items: { create: orderItems },
                user: { connect: { id: userId } },
            },
            });
            // 6. Clean up - clear the users cart, delete cartItems
            const cartItemIds = user.cart.map(cartItem => cartItem.id);
            await ctx.db.mutation.deleteManyCartItems({
            where: {
                id_in: cartItemIds,
            },
            });
            // 7. Return the Order to the client
            return order;
        }catch(error){
            throw new Error(error);
        }
    }
};

module.exports = Mutations;
