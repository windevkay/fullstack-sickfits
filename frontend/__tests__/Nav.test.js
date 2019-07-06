import {mount} from 'enzyme';
import wait from 'waait';
import Nav from '../components/Nav';
import toJSON from 'enzyme-to-json';
import {CURRENT_USER_QUERY} from '../components/User';
import {MockedProvider} from 'react-apollo/test-utils';
import {fakeUser} from '../lib/testUtils';

const notSignedInMocks = [
    {
        request: {query: CURRENT_USER_QUERY},
        result: {data: {me: null}}
    }
];

const signedInMocks = [
    {
        request: {query: CURRENT_USER_QUERY},
        result: {data: {me: fakeUser()}}
    }
]

describe('<Nav/>', () => {
    it('renders a minimal Nav when not logged in', async () => {
        const wrapper = mount(
            <MockedProvider mocks={notSignedInMocks}>
                <Nav/>
            </MockedProvider>
        );
        await wait();
        wrapper.update();
        //console.log(wrapper.debug());
        const nav = wrapper.find('[data-test="nav"]');
        expect(toJSON(nav)).toMatchSnapshot();
    })

    it('renders a full nav when signed in', async () => {
        const wrapper = mount(
            <MockedProvider mocks={signedInMocks}>
                <Nav/>
            </MockedProvider>
        );
        await wait();
        wrapper.update();
        //console.log(wrapper.debug());
        const nav = wrapper.find('[data-test="nav"]');
        expect(toJSON(nav)).toMatchSnapshot();
        expect(nav.children().length).toBe(7);
    })
})