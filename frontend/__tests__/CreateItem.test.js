import { mount } from 'enzyme';
import wait from 'waait';
import toJSON from 'enzyme-to-json';
import CreateItem, { CREATE_ITEM_MUTATION } from '../components/CreateItem';
import { MockedProvider } from 'react-apollo/test-utils';
import Router from 'next/router';
import {fakeItem} from '../lib/testUtils';

//mock the global fetch API
const testImage = 'https://test.com/test.jpg';
global.fetch = jest.fn().mockResolvedValue({
    json: () => ({
        secure_url: testImage,
        eager: [{secure_url: testImage}]
    })
});

describe('<CreateItem/>', () => {
    it('should render and match snapshot', () => {
        const wrapper = mount(
            <MockedProvider>
                <CreateItem/>
            </MockedProvider>
        );
        const form = wrapper.find('form[data-test="form"]');
        expect(toJSON(form)).toMatchSnapshot();
    })

    it('uploads a file when changed', async () => {
        const wrapper = mount(
            <MockedProvider>
                <CreateItem/>
            </MockedProvider>
        );
        const input = wrapper.find('input[type="file"]');
        //simulate a file upload 
        input.simulate('change', {target: {files: ['fakeImage.jpg']}});
        await wait();
        const component = wrapper.find('CreateItem').instance();
        expect(component.state.image).toEqual(testImage);
        expect(component.state.largeImage).toEqual(testImage);
        expect(global.fetch).toHaveBeenCalled();
        global.fetch.mockReset();
    })

    it('handles state updating', async () => {
        const wrapper = mount(
            <MockedProvider>
                <CreateItem/>
            </MockedProvider>
        );
        wrapper.find('#title').simulate('change', {target: {value: 'Testing', name: 'title'}}); 
        wrapper.find('#price').simulate('change', {target: {value: 50000, name: 'price', type: 'number'}}); 
        wrapper.find('#description').simulate('change', {target: {value: 'This is a nice item', name: 'description'}}); 

        expect(wrapper.find('CreateItem').instance().state).toMatchObject({
            title: 'Testing',
            price: 50000,
            description: 'This is a nice item'
        });
    })

    it('creates an item when the form is submitted', async () => {
        const item = fakeItem();
        const mocks = [
            {
                request: {
                    query: CREATE_ITEM_MUTATION,
                    variables: {
                        title: item.title,
                        price: item.price,
                        description: item.description,
                        image: '',
                        largeImage: ''
                    }
                },
                result: {
                    data: {
                        createItem: {
                            item,
                            id: 'abc123',
                            __typename: 'Item'
                        }
                    }
                }
            }
        ]
        const wrapper = mount(
            <MockedProvider mocks={mocks}>
                <CreateItem/>
            </MockedProvider>
        );
        //simulate someone filling out the form 
        wrapper.find('#title').simulate('change', {target: {value: item.title, name: 'title'}}); 
        wrapper.find('#price').simulate('change', {target: {value: item.price, name: 'price', type: 'number'}}); 
        wrapper.find('#description').simulate('change', {target: {value: item.description, name: 'description'}}); 
        //mock the router 
        Router.router = {push: jest.fn()};
        wrapper.find('form').simulate('submit');
        await wait(50);
        expect(Router.router.push).toHaveBeenCalled();
        expect(Router.router.push).toHaveBeenCalledWith({"pathname": "/item", "query": {"id": "abc123"}});
    })
})