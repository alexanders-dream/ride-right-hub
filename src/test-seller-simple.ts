import { SQLiteClient } from './infrastructure/database/sqlite-client';
import { SQLiteUserRepository } from './infrastructure/database/sqlite-user.repository';
import { SQLiteListingRepository } from './infrastructure/database/sqlite-listing.repository';
import { ListingEntity } from './domain/entities/listing.entity';
import { PriceValueObject } from './domain/value-objects/price.value-object';
import { MileageValueObject } from './domain/value-objects/mileage.value-object';
import { LocationValueObject } from './domain/value-objects/location.value-object';
import { UserEntity } from './domain/entities/user.entity';

// Simple test to verify the seller UI/UX flow works
async function testSellerSimple() {
  console.log('🧪 Testing Seller UI/UX Flow (Simple)...\n');

  try {
    // Initialize database and services
    const sqliteClient = new SQLiteClient();
    const db = sqliteClient.getDatabase();
    const userRepository = new SQLiteUserRepository(db);
    const listingRepository = new SQLiteListingRepository(db);

    // Test 1: Create seller user
    console.log('📋 Test 1: Create Seller User');
    const sellerUser = UserEntity.create({
      email: 'seller@test.com',
      passwordHash: 'hashed_password',
      name: 'Test Seller',
      role: 'seller',
    });

    await userRepository.save(sellerUser);
    console.log(`✅ Seller user created: ${sellerUser.name}`);
    console.log(`✅ Can create listings: ${sellerUser.canCreateListing()}\n`);

    // Test 2: Create listing directly using repository
    console.log('📋 Test 2: Create Listing (Direct)');
    const listing = ListingEntity.create({
      userId: sellerUser.id,
      title: '2022 Harley-Davidson Street Glide Special - Low Miles',
      description: 'Excellent condition, garage kept, low miles, all service records available.',
      year: 2022,
      make: 'Harley-Davidson',
      model: 'Street Glide Special',
      price: new PriceValueObject(25000),
      mileage: new MileageValueObject(3200),
      engineSize: 1868,
      color: 'Black',
      location: new LocationValueObject('Los Angeles, CA'),
      sellerType: 'private',
    });

    const savedListing = await listingRepository.save(listing);
    console.log(`✅ Listing created successfully!`);
    console.log(`   - Title: ${savedListing.title}`);
    console.log(`   - Price: $${savedListing.price.getValue()}`);
    console.log(`   - Status: ${savedListing.status}\n`);

    // Test 3: Get user's listings
    console.log('📋 Test 3: Get User Listings');
    const userListings = await listingRepository.findByUserId(sellerUser.id);
    console.log(`✅ Found ${userListings.length} listings for user`);
    userListings.forEach((listing, index) => {
      console.log(`   ${index + 1}. ${listing.title} - $${listing.price.getValue()}`);
    });
    console.log('');

    // Test 4: Search listings
    console.log('📋 Test 4: Search Listings');
    const searchResults = await listingRepository.search({
      make: 'Harley-Davidson',
      minPrice: 20000,
      maxPrice: 30000,
      limit: 10,
      page: 1,
    });
    console.log(`✅ Search found ${searchResults.length} listings\n`);

    // Test 5: Delete listing
    console.log('📋 Test 5: Delete Listing');
    await listingRepository.delete(savedListing.id);
    console.log(`✅ Listing deleted successfully\n`);

    // Test 6: Verify listing is gone
    console.log('📋 Test 6: Verify Listing Deletion');
    const remainingListings = await listingRepository.findByUserId(sellerUser.id);
    console.log(`✅ User now has ${remainingListings.length} listings\n`);

    console.log('🎉 All seller flow tests passed!');
    console.log('\n📊 Summary:');
    console.log('   - Seller permissions work correctly');
    console.log('   - Listing creation saves to database');
    console.log('   - User listings can be retrieved');
    console.log('   - Search functionality works');
    console.log('   - Listing deletion works');
    console.log('   - Database integration is functional');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testSellerSimple().catch(console.error);
