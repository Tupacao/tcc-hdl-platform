import { InMemoryProjectRepository } from '../../application/projects/repository/in-memory-project.repository.js';
import { runProjectRepositoryContract } from './project-repository.contract.js';

runProjectRepositoryContract('InMemoryProjectRepository', () => new InMemoryProjectRepository());
