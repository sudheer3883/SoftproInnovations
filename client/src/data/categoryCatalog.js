import microcontrollersImage from '../assets/1.avif';
import sensorsImage from '../assets/2.png';
import indicatorsImage from '../assets/3.png';
import motorsImage from '../assets/4.png';
import communicationModulesImage from '../assets/5.png';
import batteryComponentsImage from '../assets/6.png';
import developmentBoardsImage from '../assets/7.png';
import displaysImage from '../assets/8.png';
import actuatorsImage from '../assets/9.png';
import powerComponentsImage from '../assets/10.png';

const categoryCatalog = [
    {
        name: 'Microcontrollers',
        image: microcontrollersImage,
        description: 'Compact programmable chips used to control electronic circuits and embedded projects.',
    },
    {
        name: 'Sensors',
        image: sensorsImage,
        description: 'Components that detect temperature, motion, light, distance, sound, and other physical conditions.',
    },
    {
        name: 'Indicators',
        image: indicatorsImage,
        description: 'Visual and audible components such as LEDs, buzzers, and signal indicators for project feedback.',
    },
    {
        name: 'Motors',
        image: motorsImage,
        description: 'Motors and motor accessories for movement, rotation, robotics, and automation projects.',
    },
    {
        name: 'Communication Modules',
        image: communicationModulesImage,
        description: 'Wireless and wired modules for Bluetooth, Wi-Fi, GSM, GPS, and serial communication.',
    },
    {
        name: 'Battery Components',
        image: batteryComponentsImage,
        description: 'Batteries, holders, charging boards, and protection modules for portable electronics.',
    },
    {
        name: 'Development Boards',
        image: developmentBoardsImage,
        description: 'Ready-to-use controller boards for prototyping, programming, and embedded development.',
    },
    {
        name: 'Displays',
        image: displaysImage,
        description: 'LCD, OLED, seven-segment, and other display modules for showing project information.',
    },
    {
        name: 'Actuators',
        image: actuatorsImage,
        description: 'Devices that convert electrical signals into physical movement, including servos and linear actuators.',
    },
    {
        name: 'Power Components',
        image: powerComponentsImage,
        description: 'Power supplies, converters, regulators, solar panels, and modules for reliable energy delivery.',
    },
];

export default categoryCatalog;
