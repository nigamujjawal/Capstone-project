require('dotenv').config();
const mongoose = require('mongoose');
const Cake = require('../models/cake.model');
const logger = require('../config/logger');

const cakes = [
  {
    name: 'Belgian Dark Chocolate Delight',
    description: 'Rich 70% Belgian dark chocolate sponge layered with smooth ganache and chocolate curls.',
    category: 'Chocolate',
    price: 34.99,
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
  {
    name: 'Classic New York Cheesecake',
    description: 'Dense, creamy graham-cracker crust cheesecake topped with fresh berry compote.',
    category: 'Cheesecake',
    price: 29.99,
    imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
  {
    name: 'Fresh Mango Passionfruit Burst',
    description: 'Light vanilla sponge soaked in mango nectar with fresh Alphonso slices and passionfruit jelly.',
    category: 'Fruity',
    price: 31.50,
    imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
  {
    name: 'Madagascar Vanilla Bean Supreme',
    description: 'Moist vanilla bean cake filled with artisan whipped butter cream and edible gold flakes.',
    category: 'Vanilla',
    price: 27.99,
    imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
  {
    name: 'Vegan Salted Caramel Fudge',
    description: '100% Plant-based chocolate cake dripping with homemade vegan salted caramel and roasted pecans.',
    category: 'Vegan',
    price: 36.00,
    imageUrl: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
  {
    name: 'Custom Celebration Tier Cake',
    description: 'Bespoke 3-tier customizable cake with hand-crafted fondant decorations for special events.',
    category: 'Custom',
    price: 75.00,
    imageUrl: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
  {
    name: 'Triple Berry Lemon Tart Cake',
    description: 'Zesty lemon sponge filled with raspberries, blueberries, and blackberries.',
    category: 'Fruity',
    price: 32.00,
    imageUrl: 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
  {
    name: 'Chocolate Hazelnut Praline',
    description: 'Decadent chocolate layers infused with crushed Italian hazelnuts and Nutella cream.',
    category: 'Chocolate',
    price: 38.50,
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
  {
    name: 'Matcha Green Tea Cheesecake',
    description: 'Japanese ceremonial grade matcha infused cream cheese cake on a black sesame crust.',
    category: 'Cheesecake',
    price: 33.99,
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
  {
    name: 'Red Velvet Vanilla Frosting',
    description: 'Traditional Southern red velvet cake with velvety vanilla cream cheese frosting.',
    category: 'Vanilla',
    price: 28.50,
    imageUrl: 'https://images.unsplash.com/photo-1586788680404-32824828d40a?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
  {
    name: 'Vegan Organic Strawberry Shortcake',
    description: 'Fluffy almond milk sponge filled with organic fresh strawberries and coconut whipped cream.',
    category: 'Vegan',
    price: 34.00,
    imageUrl: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
  {
    name: 'Personalized Photo Print Cake',
    description: 'Customizable sponge cake with edible high-resolution edible ink picture print top.',
    category: 'Custom',
    price: 49.99,
    imageUrl: 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
];

const seedDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/catalog_db';

  try {
    await mongoose.connect(mongoURI);
    logger.info('Connected to MongoDB for seeding...');

    await Cake.deleteMany({});
    logger.info('Existing cakes cleared.');

    const seededCakes = await Cake.insertMany(cakes);
    logger.info(`Successfully seeded ${seededCakes.length} cakes into catalog_db.`);

    process.exit(0);
  } catch (error) {
    logger.error(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
