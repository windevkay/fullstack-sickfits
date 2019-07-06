//if resolver is exactly the same as prisma api method, then consider using forwardTo from prisma-binding
const {forwardTo} = require('prisma-binding');
const {hasPermission} = require('../utils');

const Query = {
    items: async (parent, args, ctx, info) => {
        try{
            const items = await ctx.db.query.items(args);
            return items;
        }catch(error){
            throw new Error(error);
        }
    },
    //items: forwardTo('db'),
    item: async (parent, args, ctx, info) => {
        try{
            const item = await ctx.db.query.item(args);
            return item;
        }catch(error){
            throw new Error(error);
        }
    },
    //item: forwardTo('db');
    itemsConnection: forwardTo('db'),

    me: async (parent, args, ctx, info) => {
        try{
            //check if the request has a user id 
            if(!ctx.request.userId){
                return null;//it means there is no signed in user
            }
            return await ctx.db.query.user({where: {id: ctx.request.userId}}, info);
        }catch(error){
            throw new Error(error);
        }
    },

    users: async (parent, args, ctx, info) => {
        try{
            //check if user is logged in
            if(!ctx.request.userId){
                throw new Error('You need to be logged in for this action')
            }
            //check if user has permission to query all users
            hasPermission(ctx.request.user, ['ADMIN','PERMISSIONUPDATE']);
            //query all users
            return ctx.db.query.users({}, info);
        }catch(error){
            throw new Error(error);
        }
    },

    order: async (parent, args, ctx, info) => {
        try{
            //make sure they are logged in 
            if(!ctx.request.userId){
                throw new Error('You need to be logged in to view orders');
            }
            //query the current order 
            const order = await ctx.db.query.order({where: {id: args.id}}, info);
            //check if they have the permissions to see this order 
            const ownsOrder = order.user.id === ctx.request.userId;
            const hasPermission = ctx.request.user.permissions.includes('ADMIN');
            if(!ownsOrder || !hasPermission){
                throw new Error('You do not own or have permissions to view this order');
            }
            //return the order 
            return order;
        }catch(error){
            throw new Error(error);
        }
    },

    orders: async (parent, args, ctx, info) => {
        try{
            const {userId} = ctx.request;
            if(!userId){
                throw new Error('You need to be signed in for this..');
            }

            return await ctx.db.query.orders({
                where: {
                    user: {id: userId}
                }
            }, info);
        }catch(error){
            throw new Error(error);
        }
    }
};

module.exports = Query;
