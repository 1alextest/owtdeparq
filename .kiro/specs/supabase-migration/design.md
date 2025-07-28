# Design Document

## Overview

This design outlines the migration from a local PostgreSQL database to Supabase for the AI Pitch Deck Generator backend. The migration will maintain all existing functionality while leveraging Supabase's managed PostgreSQL service, real-time capabilities, and simplified deployment. The current setup uses TypeORM with NestJS, which will continue to work seamlessly with Supabase's PostgreSQL-compatible database.

## Architecture

### Current Architecture
- **Backend**: NestJS with TypeORM
- **Database**: Local PostgreSQL (currently commented out in app.module.ts)
- **Entities**: 10 core entities including Project, PitchDeck, Slide, etc.
- **Configuration**: Environment-based configuration with ConfigService

### Target Architecture
- **Backend**: NestJS with TypeORM (unchanged)
- **Database**: Supabase PostgreSQL (managed service)
- **Connection**: Direct PostgreSQL connection via Supabase connection string
- **Configuration**: Updated environment variables for Supabase credentials

## Components and Interfaces

### 1. Database Connection Configuration

**Current Implementation:**
```typescript
// Currently commented out in app.module.ts
TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get('DB_HOST', '52.45.94.125'),
    port: parseInt(configService.get('DB_PORT', '5432')),
    // ... other config
  })
})
```

**Target Implementation:**
```typescript
TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    url: configService.get('DATABASE_URL'), // Supabase connection string
    entities: [...], // Same entities
    synchronize: false, // Use migrations in production
    logging: configService.get('NODE_ENV') === 'development',
    ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
  })
})
```

### 2. Environment Configuration

**New Environment Variables:**
```bash
# Supabase Configuration
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

### 3. Entity Compatibility

All existing entities will remain unchanged as Supabase uses standard PostgreSQL:
- Project
- PitchDeck  
- Slide
- SlideTemplate
- MediaFile
- UserAiSettings
- DeckVersion
- ChatContext
- ContextMemoryEvent
- LearningPattern

### 4. Migration Strategy

**Phase 1: Setup Supabase Project**
- Create Supabase project
- Configure database schema
- Set up environment variables

**Phase 2: Data Migration**
- Export existing data (if any)
- Import data to Supabase
- Verify data integrity

**Phase 3: Code Updates**
- Update TypeORM configuration
- Update environment configuration
- Remove local PostgreSQL references

**Phase 4: Testing & Deployment**
- Run comprehensive tests
- Deploy to staging environment
- Validate all functionality

## Data Models

### Database Schema Migration

The existing TypeORM entities will work directly with Supabase PostgreSQL. Key considerations:

1. **Primary Keys**: UUID vs Integer (Supabase defaults to UUID)
2. **Timestamps**: Ensure proper timezone handling
3. **Indexes**: Recreate performance-critical indexes
4. **Constraints**: Verify foreign key constraints transfer correctly

### Connection Pooling

Supabase provides connection pooling by default, but we should configure TypeORM appropriately:

```typescript
{
  type: 'postgres',
  url: process.env.DATABASE_URL,
  extra: {
    max: 20, // Maximum connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
}
```

## Error Handling

### Connection Errors
- **Supabase Unavailable**: Implement retry logic with exponential backoff
- **Authentication Failures**: Clear error messages for invalid credentials
- **Network Issues**: Graceful degradation and user-friendly error messages

### Migration Errors
- **Data Integrity Issues**: Rollback mechanisms and data validation
- **Schema Mismatches**: Pre-migration schema validation
- **Performance Issues**: Query optimization and index verification

### Runtime Errors
- **Query Failures**: Enhanced logging for Supabase-specific errors
- **Connection Pool Exhaustion**: Monitoring and alerting
- **SSL/TLS Issues**: Proper certificate handling

## Testing Strategy

### Unit Tests
- **Database Connection**: Mock Supabase connections for unit tests
- **Entity Operations**: Test CRUD operations against test database
- **Configuration**: Validate environment variable handling

### Integration Tests
- **End-to-End Database Operations**: Full CRUD workflows
- **Migration Validation**: Compare pre/post migration data
- **Performance Testing**: Query performance benchmarks

### Test Environment Setup
```typescript
// Test configuration for Supabase
const testConfig = {
  type: 'postgres',
  url: process.env.TEST_DATABASE_URL,
  entities: [...],
  synchronize: true, // OK for test environment
  dropSchema: true, // Clean slate for each test run
}
```

### Data Migration Testing
1. **Schema Validation**: Ensure all tables and relationships exist
2. **Data Integrity**: Row counts and foreign key validation
3. **Performance Benchmarks**: Query execution time comparisons
4. **Rollback Testing**: Ability to revert changes if needed

## Security Considerations

### Connection Security
- Use SSL/TLS for all database connections
- Store Supabase credentials securely (environment variables)
- Implement connection string validation

### Access Control
- Use Supabase Row Level Security (RLS) if needed
- Maintain existing authentication patterns
- Audit database access patterns

### Data Protection
- Ensure data encryption in transit and at rest
- Implement proper backup and recovery procedures
- Monitor for unusual database activity

## Performance Optimization

### Query Optimization
- Review and optimize existing queries for Supabase
- Implement proper indexing strategy
- Use Supabase's query performance insights

### Connection Management
- Configure appropriate connection pool sizes
- Implement connection health checks
- Monitor connection usage patterns

### Caching Strategy
- Leverage existing application-level caching
- Consider Supabase's built-in caching features
- Implement query result caching where appropriate