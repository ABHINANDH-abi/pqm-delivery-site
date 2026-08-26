import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // Default Admin User
  const adminEmail = 'admin@restaurant.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin@123456', salt);

    await prisma.user.create({
      data: {
        name: 'Restaurant Admin',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true,
      },
    });
    console.log('✅ Created default admin user: admin@restaurant.com / Admin@123456');
  }

  // Default Delivery Partner 1
  const deliveryEmail = 'driver@example.com';
  const existingDelivery = await prisma.user.findUnique({
    where: { email: deliveryEmail },
  });

  if (!existingDelivery) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Driver@123456', salt);

    await prisma.user.create({
      data: {
        name: 'Ramesh Kumar (Express Rider)',
        email: deliveryEmail,
        phone: '+919876543299',
        passwordHash,
        role: 'DELIVERY_PARTNER',
        isActive: true,
        isEmailVerified: true,
        deliveryProfile: {
          create: {
            vehicleType: 'Motorcycle / Scooter',
            vehicleNumber: 'TN-37-AB-1234',
            isVerified: true,
            status: 'AVAILABLE',
          },
        },
      },
    });
    console.log('✅ Created default delivery partner 1: driver@example.com / Driver@123456');
  }

  // Delivery Partner 2 (Suresh Kumar)
  const deliveryEmail2 = 'driver2@example.com';
  const existingDelivery2 = await prisma.user.findUnique({
    where: { email: deliveryEmail2 },
  });

  if (!existingDelivery2) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Driver@123456', salt);

    await prisma.user.create({
      data: {
        name: 'Suresh Kumar (Fast Express)',
        email: deliveryEmail2,
        phone: '+919876588888',
        passwordHash,
        role: 'DELIVERY_PARTNER',
        isActive: true,
        isEmailVerified: true,
        deliveryProfile: {
          create: {
            vehicleType: 'Scooter / EV Bike',
            vehicleNumber: 'TN-37-XY-5678',
            isVerified: true,
            status: 'AVAILABLE',
          },
        },
      },
    });
    console.log('✅ Created delivery partner 2: driver2@example.com / Driver@123456');
  }

  // Default Customer User
  const customerEmail = 'customer@example.com';
  const existingCustomer = await prisma.user.findUnique({
    where: { email: customerEmail },
  });

  if (!existingCustomer) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Customer@123456', salt);

    await prisma.user.create({
      data: {
        name: 'Abhishek Kumar',
        email: customerEmail,
        phone: '+919876543211',
        passwordHash,
        role: 'CUSTOMER',
        isActive: true,
        isEmailVerified: true,
        addresses: {
          create: {
            label: 'Home',
            addressLine1: '12, MG Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560001',
            isDefault: true,
          },
        },
      },
    });
    console.log('✅ Created default customer: customer@example.com / Customer@123456');
  }

  // Seed Food Categories & Menu Items
  const categoriesData = [
    {
      name: 'Starters & Appetizers',
      description: 'Crispy, savory bites to kickstart your meal',
      imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80',
      sortOrder: 1,
      products: [
        {
          name: 'Paneer Tikka Grill',
          description: 'Cottage cheese marinated in spiced yogurt and grilled to perfection in tandoor.',
          price: 260,
          imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80',
          isVeg: true,
        },
        {
          name: 'Chicken Wings Supreme',
          description: 'Crispy fried wings tossed in signature BBQ hot sauce served with garlic dip.',
          price: 320,
          imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80',
          isVeg: false,
        },
        {
          name: 'Crispy Spring Rolls',
          description: 'Golden fried rolls stuffed with shredded vegetables and glass noodles.',
          price: 210,
          imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
          isVeg: true,
        },
      ],
    },
    {
      name: 'Woodfired Pizzas',
      description: 'Handcrafted artisan pizzas baked in stone ovens',
      imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80',
      sortOrder: 2,
      products: [
        {
          name: 'Classic Margherita Pizza',
          description: 'San Marzano tomato sauce, fresh mozzarella, and sweet basil leaves.',
          price: 380,
          imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80',
          isVeg: true,
        },
        {
          name: 'Pepperoni Feast Pizza',
          description: 'Loaded with double spicy pepperoni slices and extra mozzarella cheese.',
          price: 490,
          imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80',
          isVeg: false,
        },
        {
          name: 'Farmhouse Special Pizza',
          description: 'Bell peppers, onions, sweet corn, mushrooms, and jalapeños.',
          price: 430,
          imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80',
          isVeg: true,
        },
      ],
    },
    {
      name: 'Main Course Specialties',
      description: 'Rich, authentic gravies and gourmet biryanis',
      imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80',
      sortOrder: 3,
      products: [
        {
          name: 'Butter Chicken Masala',
          description: 'Tender chicken simmered in a velvet tomato and cashew gravy with cream.',
          price: 360,
          imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80',
          isVeg: false,
        },
        {
          name: 'Paneer Butter Masala',
          description: 'Soft cottage cheese cubes cooked in a rich, mild, creamy gravy.',
          price: 310,
          imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
          isVeg: true,
        },
        {
          name: 'Hyderabadi Dum Biryani',
          description: 'Slow-cooked fragrant basmati rice layered with spiced marinated meat and saffron.',
          price: 390,
          imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
          isVeg: false,
        },
      ],
    },
    {
      name: 'Desserts & Sweets',
      description: 'Indulgent sweet treats to wrap up your feast',
      imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
      sortOrder: 4,
      products: [
        {
          name: 'Choco Lava Cake',
          description: 'Warm chocolate cake filled with rich molten chocolate center.',
          price: 150,
          imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
          isVeg: true,
        },
        {
          name: 'Gulab Jamun with Ice Cream',
          description: 'Warm fried milk dumplings served with vanilla bean ice cream.',
          price: 130,
          imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80',
          isVeg: true,
        },
      ],
    },
    {
      name: 'Beverages & Mocktails',
      description: 'Refreshing drinks and chilled brews',
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
      sortOrder: 5,
      products: [
        {
          name: 'Fresh Mint Mojito',
          description: 'Crisp combination of lime juice, fresh mint leaves, and sparkling soda.',
          price: 140,
          imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
          isVeg: true,
        },
        {
          name: 'Iced Cold Coffee',
          description: 'Blended espresso with cold milk, sugar, and ice cream float.',
          price: 160,
          imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
          isVeg: true,
        },
      ],
    },
  ];

  for (const catData of categoriesData) {
    const { products, ...categoryFields } = catData;

    const category = await prisma.category.upsert({
      where: { name: categoryFields.name },
      update: categoryFields,
      create: categoryFields,
    });

    for (const prodData of products) {
      const existingProduct = await prisma.product.findFirst({
        where: { name: prodData.name, categoryId: category.id },
      });

      if (!existingProduct) {
        await prisma.product.create({
          data: {
            ...prodData,
            categoryId: category.id,
          },
        });
      }
    }
  }

  console.log('✅ Seeded categories and food menu items successfully!');
  console.log('✨ Seeding completed successfully.');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
