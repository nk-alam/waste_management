import { collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { hashPassword, comparePassword } from '../middleware/auth.js';

// Database schema initialization and validation
export class DatabaseSchema {

  // Initialize default collections with sample data
  static async initializeSchema() {
    try {
      console.log('🔄 Initializing database schema...');

      // Initialize admin user
      await this.initializeAdminUser();

      // Initialize sample ULB
      await this.initializeSampleULB();

      // Initialize waste segregation guidelines
      await this.initializeWasteGuidelines();

      // Initialize sample facilities
      await this.initializeSampleFacilities();

      console.log('✅ Database schema initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing schema:', error);
      throw error;
    }
  }

  // Initialize admin user
  static async initializeAdminUser() {
    const adminRef = doc(db, 'users', 'admin');
    const adminDoc = await getDoc(adminRef);

    if (!adminDoc.exists()) {
      const hashed = await hashPassword('admin123');
      const adminData = {
        email: 'admin@wastems.com',
        password: hashed,
        role: 'admin',
        name: 'System Administrator',
        isActive: true,
        permissions: ['all'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await setDoc(adminRef, adminData);
      console.log('✅ Admin user created');
    } else {
      // Auto-repair: if stored password is invalid or not a valid bcrypt hash, reset to default
      const data = adminDoc.data() || {};
      const currentHash = data.password;
      let needsRepair = false;
      try {
        // If no password or compare fails against default, mark for repair
        if (!currentHash) {
          needsRepair = true;
        } else {
          const ok = await comparePassword('admin123', currentHash);
          if (!ok) needsRepair = true;
        }
      } catch (_e) {
        needsRepair = true;
      }

      // Allow disabling via ADMIN_AUTO_REPAIR=false
      const autoRepair = (process.env.ADMIN_AUTO_REPAIR || 'true').toLowerCase() !== 'false';
      if (needsRepair && autoRepair) {
        const hashed = await hashPassword('admin123');
        await updateDoc(adminRef, { password: hashed, updatedAt: new Date(), isActive: true, role: 'admin' });
        console.log('🔧 Admin password auto-repaired to default');
      }
    }
  }

  // Initialize sample ULB
  static async initializeSampleULB() {
    const ulbData = {
      name: 'Mumbai Municipal Corporation',
      code: 'MMC001',
      state: 'Maharashtra',
      district: 'Mumbai',
      address: {
        street: 'CST Road',
        city: 'Mumbai',
        pincode: '400001',
        state: 'Maharashtra'
      },
      contact: {
        phone: '+91-22-22620800',
        email: 'info@mumbaimunicipal.gov.in',
        website: 'https://www.mumbaimunicipal.gov.in'
      },
      wasteManagementStatus: {
        totalWard: 24,
        activeWards: 24,
        totalPopulation: 12478447,
        wasteGeneratedPerDay: 7000, // tons
        segregationCompliance: 65,
        lastUpdated: new Date()
      },
      policies: {
        segregationMandatory: true,
        penaltyAmount: 500,
        incentiveAmount: 100,
        trainingRequired: true
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const ulbRef = doc(db, 'ulbs', 'MMC001');
    const ulbDoc = await getDoc(ulbRef);

    if (!ulbDoc.exists()) {
      await setDoc(ulbRef, ulbData);
      console.log('✅ Sample ULB created');
    }
  }

  // Initialize waste segregation guidelines
  static async initializeWasteGuidelines() {
    const guidelines = {
      wetWaste: {
        name: 'Wet Waste (Organic)',
        description: 'Biodegradable organic waste that can be composted',
        examples: ['Food scraps', 'Vegetable peels', 'Fruit waste', 'Tea leaves', 'Coffee grounds', 'Eggshells', 'Garden waste'],
        binColor: 'Green',
        treatmentMethod: 'Composting/Biomethanization',
        doNotInclude: ['Plastic bags', 'Metal items', 'Glass', 'Sanitary waste']
      },
      dryWaste: {
        name: 'Dry Waste (Recyclable)',
        description: 'Non-biodegradable waste that can be recycled',
        examples: ['Paper', 'Cardboard', 'Plastic bottles', 'Metal cans', 'Glass bottles', 'Fabric', 'Electronics'],
        binColor: 'Blue',
        treatmentMethod: 'Recycling',
        doNotInclude: ['Food waste', 'Liquid waste', 'Hazardous materials']
      },
      hazardousWaste: {
        name: 'Hazardous Waste',
        description: 'Dangerous waste that requires special handling',
        examples: ['Batteries', 'Medicines', 'Paints', 'Pesticides', 'Sanitary napkins', 'Diapers', 'Cigarette butts'],
        binColor: 'Red',
        treatmentMethod: 'Special Treatment/Incineration',
        doNotInclude: ['Regular household waste', 'Food waste', 'Recyclable materials']
      },
      lastUpdated: new Date()
    };

    const guidelinesRef = doc(db, 'waste_guidelines', 'segregation');
    const guidelinesDoc = await getDoc(guidelinesRef);

    if (!guidelinesDoc.exists()) {
      await setDoc(guidelinesRef, guidelines);
      console.log('✅ Waste guidelines created');
    }
  }

  // Initialize sample facilities
  static async initializeSampleFacilities() {
    const facilities = [
      {
        id: 'FAC001',
        name: 'Mumbai Biomethanization Plant',
        type: 'biomethanization',
        location: {
          lat: 19.0760,
          lng: 72.8777,
          address: 'Deonar, Mumbai'
        },
        capacity: 1000, // tons per day
        currentLoad: 650,
        efficiency: 85,
        ulbId: 'MMC001',
        status: 'active',
        manager: 'Dr. Rajesh Kumar',
        contact: '+91-9876543210',
        createdAt: new Date()
      },
      {
        id: 'FAC002',
        name: 'Mumbai Waste-to-Energy Plant',
        type: 'wte',
        location: {
          lat: 19.0760,
          lng: 72.8777,
          address: 'Mulund, Mumbai'
        },
        capacity: 500, // tons per day
        currentLoad: 400,
        efficiency: 90,
        ulbId: 'MMC001',
        status: 'active',
        manager: 'Ms. Priya Sharma',
        contact: '+91-9876543211',
        createdAt: new Date()
      },
      {
        id: 'FAC003',
        name: 'Mumbai Recycling Center',
        type: 'recycling',
        location: {
          lat: 19.0760,
          lng: 72.8777,
          address: 'Bhandup, Mumbai'
        },
        capacity: 200, // tons per day
        currentLoad: 150,
        efficiency: 75,
        ulbId: 'MMC001',
        status: 'active',
        manager: 'Mr. Amit Patel',
        contact: '+91-9876543212',
        createdAt: new Date()
      }
    ];

    for (const facility of facilities) {
      const facilityRef = doc(db, 'waste_facilities', facility.id);
      const facilityDoc = await getDoc(facilityRef);

      if (!facilityDoc.exists()) {
        await setDoc(facilityRef, facility);
      }
    }

    console.log('✅ Sample facilities created');
  }

  // Collection schemas for validation
  static getCollectionSchemas() {
    return {
      users: {
        required: ['email', 'role', 'name'],
        optional: ['password', 'isActive', 'permissions', 'profile', 'lastLogin']
      },
      citizens: {
        required: ['personalInfo', 'aadhaar', 'address'],
        optional: ['trainingStatus', 'kitsReceived', 'segregationCompliance', 'rewardPoints', 'penaltyHistory']
      },
      waste_workers: {
        required: ['personalInfo', 'area', 'role'],
        optional: ['trainingPhases', 'safetyGear', 'attendance', 'performanceRating']
      },
      green_champions: {
        required: ['areaAssigned', 'personalInfo'],
        optional: ['citizensUnderSupervision', 'trainingsConducted', 'violationsReported', 'performanceMetrics']
      },
      households: {
        required: ['address', 'residentCount', 'ulbId'],
        optional: ['segregationStatus', 'collectionSchedule', 'complianceScore']
      },
      bulk_generators: {
        required: ['name', 'type', 'address', 'ulbId'],
        optional: ['wasteGeneration', 'complianceStatus', 'penaltyHistory']
      },
      waste_facilities: {
        required: ['name', 'type', 'location', 'capacity', 'ulbId'],
        optional: ['currentLoad', 'efficiency', 'status', 'manager']
      },
      collection_vehicles: {
        required: ['vehicleNumber', 'type', 'capacity', 'ulbId'],
        optional: ['driver', 'route', 'status', 'location', 'fuelEfficiency']
      },
      training_enrollments: {
        required: ['citizenId', 'module', 'status'],
        optional: ['enrolledAt', 'completedAt', 'score', 'certificate']
      },
      segregation_violations: {
        required: ['citizenId', 'violationType', 'reportedBy'],
        optional: ['description', 'evidence', 'penaltyAmount', 'status']
      },
      monitoring_reports: {
        required: ['reporterId', 'area', 'issueType'],
        optional: ['description', 'photos', 'location', 'status', 'resolvedAt']
      },
      cleaning_events: {
        required: ['name', 'date', 'area', 'organizer'],
        optional: ['description', 'participants', 'status', 'photos']
      },
      kit_orders: {
        required: ['citizenId', 'kitType', 'quantity'],
        optional: ['status', 'deliveryAddress', 'orderedAt', 'deliveredAt']
      },
      incentive_rewards: {
        required: ['citizenId', 'type', 'points'],
        optional: ['description', 'awardedAt', 'redeemedAt', 'status']
      },
      penalties: {
        required: ['citizenId', 'type', 'amount'],
        optional: ['description', 'imposedAt', 'paidAt', 'status']
      },
      ulbs: {
        required: ['name', 'code', 'state', 'district'],
        optional: ['address', 'contact', 'wasteManagementStatus', 'policies']
      }
    };
  }

  // Validate document against schema
  static validateDocument(collectionName, data) {
    const schemas = this.getCollectionSchemas();
    const schema = schemas[collectionName];

    if (!schema) {
      throw new Error(`Unknown collection: ${collectionName}`);
    }

    const errors = [];

    // Check required fields
    schema.required.forEach(field => {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }

    return true;
  }
}

export default DatabaseSchema;
