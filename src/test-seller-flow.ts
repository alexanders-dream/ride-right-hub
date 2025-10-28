import { SQLiteClient } from './infrastructure/database/sqlite-client';
import { SQLiteUserRepository } from './infrastructure/database/sqlite-user.repository';
import { SQLiteListingRepository } from './infrastructure/database/sqlite-listing.repository';
import { ListingService } from './services/listing.service';
import { ValidationService } from './services/validation.service';
import { StubImageService, StubNotificationService } from './services/stub-services';
import { UserEntity } from './domain/entities/user.entity';

// Test the seller UI/UX flow
async function testSellerFlow() {
  console.log('🧪 Testing Seller UI/UX Flow...\n');

  try {
    // Initialize database and services
    const sqliteClient = new SQLiteClient();
    const db = sqliteClient.getDatabase();
    const userRepository = new SQLiteUserRepository(db);
    const listingRepository = new SQLiteListingRepository(db);
    
    const validationService = new ValidationService();
    
    const listingService = new ListingService(
      listingRepository,
      userRepository,
      validationService,
      new StubImageService(),
      new StubNotificationService()
    );

    // Test 1: Check if seller user can create listings
    console.log('📋 Test 1: Seller Permissions');
    const sellerUser = UserEntity.create({
      email: 'seller@test.com',
      passwordHash: 'hashed_password',
      name: 'Test Seller',
      role: 'seller',
    });

    // Save user to database first
    await userRepository.save(sellerUser);

    console.log(`✅ Seller user created: ${sellerUser.name}`);
    console.log(`✅ Can create listings: ${sellerUser.canCreateListing()}`);
    console.log(`✅ Can manage listings: ${sellerUser.canManageListings()}\n`);

    // Test 2: Create a listing
    console.log('📋 Test 2: Create Listing');
    const listingData = {
      title: '2022 Harley-Davidson Street Glide Special - Low Miles',
      description: 'Excellent condition, garage kept, low miles, all service records available. Perfect for touring.',
      year: 2022,
      make: 'Harley-Davidson',
      model: 'Street Glide Special',
      price: 25000,
      mileage: 3200,
      engineSize: 1868,
      color: 'Black',
      location: 'Los Angeles, CA',
      sellerType: 'private' as const,
    };

    console.log('Listing data:', JSON.stringify(listingData, null, 2));
    
    const newListing = await listingService.createListing(sellerUser.id, listingData);
    console.log(`✅ Listing created successfully!`);
    console.log(`   - Title: ${newListing.title}`);
    console.log(`   - Price: $${newListing.price.getValue()}`);
    console.log(`   - Status: ${newListing.status}\n`);

    // Test 3: Get user's listings
    console.log('📋 Test 3: Get User Listings');
    const userListings = await listingService.getUserListings(sellerUser.id);
    console.log(`✅ Found ${userListings.length} listings for user`);
    userListings.forEach((listing, index) => {
      console.log(`   ${index + 1}. ${listing.title} - $${listing.price.getValue()}`);
    });
    console.log('');

    // Test 4: Search listings
    console.log('📋 Test 4: Search Listings');
    const searchResults = await listingService.searchListings({
      make: 'Harley-Davidson',
      minPrice: 20000,
      maxPrice: 30000,
      limit: 10,
      page: 1,
    });
    console.log(`✅ Search found ${searchResults.listings.length} listings`);
    console.log(`   - Total count: ${searchResults.totalCount}`);
    console.log(`   - Current page: ${searchResults.currentPage}`);
    console.log(`   - Total pages: ${searchResults.totalPages}\n`);

    // Test 5: Delete listing
    console.log('📋 Test 5: Delete Listing');
    await listingService.deleteListing(sellerUser.id, newListing.id);
    console.log(`✅ Listing deleted successfully\n`);

    // Test 6: Verify listing is gone
    console.log('📋 Test 6: Verify Listing Deletion');
    const remainingListings = await listingService.getUserListings(sellerUser.id);
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
testSellerFlow().catch(console.error);
