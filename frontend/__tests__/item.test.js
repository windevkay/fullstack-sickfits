import ItemComponent from '../components/Item';
import {shallow, mount, render} from 'enzyme';
import toJSON from 'enzyme-to-json';
/** 
mount(<Component />) for Full DOM rendering is ideal for use cases where you have components that may interact with 
DOM apis, or may require the full lifecycle in order to fully test the component (ie, componentDidMount etc.)
vs.
shallow(<Component />) for Shallow rendering is useful to constrain yourself to testing a component as a unit, 
and to ensure that your tests aren't indirectly asserting on behavior of child components.
vs.
render which is used to render react components to static HTML and analyze the resulting HTML structure.
*/

//this represents sample props passed to an item component
const sampleItem = {
    id: 'ABC',
    title: 'A test item',
    price: 7000,
    description: 'A really cool item',
    image: 'product.png',
    largeImage: 'large_product.png'
}

describe('<Item/>', () => {
    it('renders and displays correctly', () => {
        const wrapper = shallow(<ItemComponent item={sampleItem}/>);
        const priceTag = wrapper.find('PriceTag');
        //console.log(wrapper.debug());
        //console.log(priceTag.children().text());
        expect(priceTag.children().text()).toBe('$70');
        expect(wrapper.find('Title a').text()).toBe(sampleItem.title);
    })

    it('renders the item image correctly', () => {
        const wrapper = shallow(<ItemComponent item={sampleItem}/>);
        //test image 
        const img = wrapper.find('img');
        expect(img.props().src).toBe(sampleItem.image);
        expect(img.props().alt).toBe(sampleItem.title);
    })

    it('renders out buttons correctly', () => {
        const wrapper = shallow(<ItemComponent item={sampleItem}/>);
        const buttonList = wrapper.find('.buttonList');
        //the add to cart, edit and delete buttons
        expect(buttonList.children()).toHaveLength(3);
        //check that one of the button list children is a link
        expect(buttonList.find('Link')).toHaveLength(1);
        expect(buttonList.find('AddtoCart').exists()).toBeTruthy;
        expect(buttonList.find('DeleteItem').exists()).toBeTruthy;
    })
    //testing with snapshot
    it('renders and matches the snapshot', () => {
        const wrapper = shallow(<ItemComponent item={sampleItem}/>);
        expect(toJSON(wrapper)).toMatchSnapshot();
    })
})

