const PostgresRepository = require('./PostgresRepository');
const FirestoreRepository = require('./FirestoreRepository');

class RepositoryFactory {
  static async initializeRepository() {
    try {
      const repositoryType = process.env.REPOSITORY_TYPE || 'postgres';
      
      console.log(`📊 Initializing ${repositoryType} repository...`);
      
      let repository;
      
      switch (repositoryType.toLowerCase()) {
        case 'postgres':
          repository = new PostgresRepository();
          await repository.initialize();
          break;
          
        case 'firestore':
          repository = new FirestoreRepository();
          await repository.initialize();
          break;
          
        default:
          throw new Error(`Unsupported repository type: ${repositoryType}`);
      }
      
      console.log(`✅ ${repositoryType} repository initialized successfully`);
      return repository;
      
    } catch (error) {
      console.error('❌ Failed to initialize repository:', error.message);
      throw error;
    }
  }
  
  static createRepository(type = 'postgres') {
    switch (type.toLowerCase()) {
      case 'postgres':
        return new PostgresRepository();
      case 'firestore':
        return new FirestoreRepository();
      default:
        throw new Error(`Unsupported repository type: ${type}`);
    }
  }
}

module.exports = RepositoryFactory;