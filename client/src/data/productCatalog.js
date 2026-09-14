import sevenSegmentImage from '../assets/8.png';
import tftImage from '../assets/14.png';
import oledImage from '../assets/3.png';
import twentyFourByFourImage from '../assets/12.png';
import sixteenByTwoImage from '../assets/16.png';
import ws2812Image from '../assets/17.png';
import drv8825Image from '../assets/18.png';
import l298nImage from '../assets/19.png';
import microcontrollerImage from '../assets/1.avif';
import sensorImage from '../assets/2.png';
import communicationModuleImage from '../assets/5.png';
import batteryComponentImage from '../assets/6.png';
import developmentBoardImage from '../assets/7.png';
import actuatorImage from '../assets/9.png';
import powerComponentImage from '../assets/10.png';

const productCatalog = [
    {
        name: 'Arduino Microcontroller',
        category: 'Microcontrollers',
        image: microcontrollerImage,
        price: 899,
        originalPrice: 1099,
        description: 'Programmable microcontroller for automation, robotics, and embedded electronics projects.',
    },
    {
        name: 'HC-SR04 Ultrasonic Sensor',
        category: 'Sensors',
        image: sensorImage,
        price: 149,
        originalPrice: 199,
        description: 'Ultrasonic distance sensor for obstacle detection, ranging, and robotics projects.',
    },
    {
        name: 'Bluetooth Communication Module',
        category: 'Communication Modules',
        image: communicationModuleImage,
        price: 299,
        originalPrice: 399,
        description: 'Wireless serial communication module for connecting microcontrollers to mobile and IoT projects.',
    },
    {
        name: '18650 Battery Holder',
        category: 'Battery Components',
        image: batteryComponentImage,
        price: 79,
        originalPrice: 99,
        description: 'Compact battery holder for powering portable electronics and embedded prototypes.',
    },
    {
        name: 'Arduino Development Board',
        category: 'Development Boards',
        image: developmentBoardImage,
        price: 749,
        originalPrice: 899,
        description: 'Ready-to-use development board for rapid prototyping, programming, and embedded control.',
    },
    {
        name: 'Micro Servo Motor',
        category: 'Actuators',
        image: actuatorImage,
        price: 249,
        originalPrice: 299,
        description: 'Compact positional servo actuator for robotics, mechanisms, and automation projects.',
    },
    {
        name: 'DC-DC Buck Converter',
        category: 'Power Components',
        image: powerComponentImage,
        price: 129,
        originalPrice: 179,
        description: 'Adjustable step-down power converter for stable voltage delivery in electronic circuits.',
    },
    {
        name: '7-Segment Displays',
        category: 'Displays',
        image: sevenSegmentImage,
        price: 8000,
        originalPrice: 9000,
        description: 'Bright four-digit seven-segment display module for timers, counters, clocks, and embedded projects.',
    },
    {
        name: 'TFT',
        category: 'Displays',
        image: tftImage,
        price: 595,
        originalPrice: 750,
        description: 'Compact TFT display module for colourful graphics, dashboards, and microcontroller interfaces.',
    },
    {
        name: '0.96 OLED LCD',
        category: 'Indicators',
        image: oledImage,
        price: 7000,
        originalPrice: 8200,
        description: 'Small high-contrast OLED display module for status, sensor readings, and compact user interfaces.',
    },
    {
        name: '20x4 LCD',
        category: 'Indicators',
        image: twentyFourByFourImage,
        price: 600,
        originalPrice: 750,
        description: 'Twenty-column, four-row character LCD for readable text output in electronics projects.',
    },
    {
        name: '16x2 LCD',
        category: 'Indicators',
        image: sixteenByTwoImage,
        price: 4500,
        originalPrice: 5200,
        description: 'Classic sixteen-column, two-row character LCD module with a clear green backlit display.',
    },
    {
        name: 'WS2812',
        category: 'Indicators',
        image: ws2812Image,
        price: 4530,
        originalPrice: 5000,
        description: 'Addressable RGB LED strip for colourful lighting effects, animations, and visual indicators.',
    },
    {
        name: 'DRV8825 Stepper Motor Driver',
        category: 'Motors',
        image: drv8825Image,
        price: 3450,
        originalPrice: 3900,
        description: 'Stepper motor driver module with adjustable current control for precise motion projects.',
    },
    {
        name: 'L298N Motor Driver',
        category: 'Motors',
        image: l298nImage,
        price: 3400,
        originalPrice: 3900,
        description: 'Dual H-bridge motor driver board for controlling DC motors and stepper motors.',
    },
].map((product) => ({
    ...product,
    brand: 'Softpro Innovation',
    stock: 25,
    status: 'active',
    featured: true,
}));

export default productCatalog;
