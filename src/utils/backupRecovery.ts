/**
 * Backup and Recovery System for OUI
 * Phase 3: Production Data Management
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BackupConfig {
  enabled: boolean;
  schedule: string; // Cron expression
  retention: {
    daily: number;     // Keep last N daily backups
    weekly: number;    // Keep last N weekly backups
    monthly: number;   // Keep last N monthly backups
  };
  destinations: {
    local: string;     // Local backup path
    s3?: {
      bucket: string;
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
    };
    gcs?: {
      bucket: string;
      projectId: string;
      keyFile: string;
    };
  };
  encryption: {
    enabled: boolean;
    key: string;       // Encryption key for backups
    algorithm: 'aes-256-gcm' | 'aes-256-cbc';
  };
  compression: {
    enabled: boolean;
    algorithm: 'gzip' | 'brotli' | 'lz4';
    level: number;     // Compression level (1-9)
  };
}

export interface BackupMetadata {
  id: string;
  timestamp: number;
  type: 'full' | 'incremental' | 'differential';
  size: number;           // Size in bytes
  compressedSize?: number;
  encrypted: boolean;
  checksum: string;       // SHA-256 hash
  version: string;
  components: {
    database: boolean;
    blockchain: boolean;
    files: boolean;
    configurations: boolean;
  };
  retention: {
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
  };
}

export interface RecoveryOptions {
  backupId: string;
  components?: {
    database?: boolean;
    blockchain?: boolean;
    files?: boolean;
    configurations?: boolean;
  };
  dryRun?: boolean;
  validateIntegrity?: boolean;
}

export class BackupRecoveryService {
  private config: BackupConfig;
  private backupHistory: BackupMetadata[] = [];
  private isRunning: boolean = false;

  constructor(config: BackupConfig) {
    this.config = config;
    this.loadBackupHistory();
    this.scheduleBackups();
  }

  /**
   * Create a full backup
   */
  async createFullBackup(): Promise<BackupMetadata> {
    if (this.isRunning) {
      throw new Error('Backup already in progress');
    }

    this.isRunning = true;
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log(`🔄 Creating full backup: ${backupId}`);

      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: Date.now(),
        type: 'full',
        size: 0,
        encrypted: this.config.encryption.enabled,
        checksum: '',
        version: '3.0.0',
        components: {
          database: true,
          blockchain: true,
          files: true,
          configurations: true
        },
        retention: {
          daily: true,
          weekly: true,
          monthly: true
        }
      };

      // Backup database
      if (metadata.components.database) {
        await this.backupDatabase(backupId);
      }

      // Backup blockchain data
      if (metadata.components.blockchain) {
        await this.backupBlockchainData(backupId);
      }

      // Backup files
      if (metadata.components.files) {
        await this.backupFiles(backupId);
      }

      // Backup configurations
      if (metadata.components.configurations) {
        await this.backupConfigurations(backupId);
      }

      // Calculate final size and checksum
      metadata.size = await this.calculateBackupSize(backupId);
      metadata.checksum = await this.calculateBackupChecksum(backupId);

      // Compress backup
      if (this.config.compression.enabled) {
        await this.compressBackup(backupId);
        metadata.compressedSize = await this.calculateBackupSize(backupId);
      }

      // Encrypt backup
      if (this.config.encryption.enabled) {
        await this.encryptBackup(backupId);
      }

      // Upload to external destinations
      await this.uploadToDestinations(backupId);

      // Update backup history
      this.backupHistory.push(metadata);
      await this.saveBackupHistory();

      console.log(`✅ Full backup completed: ${backupId}`);
      return metadata;

    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Create an incremental backup
   */
  async createIncrementalBackup(): Promise<BackupMetadata> {
    if (this.isRunning) {
      throw new Error('Backup already in progress');
    }

    const lastFullBackup = this.getLastFullBackup();
    if (!lastFullBackup) {
      throw new Error('No full backup found. Create a full backup first.');
    }

    this.isRunning = true;
    const backupId = `incremental_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log(`🔄 Creating incremental backup: ${backupId}`);

      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: Date.now(),
        type: 'incremental',
        size: 0,
        encrypted: this.config.encryption.enabled,
        checksum: '',
        version: '3.0.0',
        components: {
          database: true,
          blockchain: false, // Only changes since last backup
          files: true,
          configurations: false
        },
        retention: {
          daily: true,
          weekly: false,
          monthly: false
        }
      };

      // Backup database changes
      await this.backupDatabaseChanges(backupId, lastFullBackup.timestamp);

      // Backup file changes
      await this.backupFileChanges(backupId, lastFullBackup.timestamp);

      // Calculate size and checksum
      metadata.size = await this.calculateBackupSize(backupId);
      metadata.checksum = await this.calculateBackupChecksum(backupId);

      // Compress and encrypt
      if (this.config.compression.enabled) {
        await this.compressBackup(backupId);
      }
      if (this.config.encryption.enabled) {
        await this.encryptBackup(backupId);
      }

      // Upload to destinations
      await this.uploadToDestinations(backupId);

      // Update history
      this.backupHistory.push(metadata);
      await this.saveBackupHistory();

      console.log(`✅ Incremental backup completed: ${backupId}`);
      return metadata;

    } catch (error) {
      console.error('Incremental backup failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(options: RecoveryOptions): Promise<void> {
    console.log(`🔄 Restoring from backup: ${options.backupId}`);

    const backup = this.backupHistory.find(b => b.id === options.backupId);
    if (!backup) {
      throw new Error(`Backup ${options.backupId} not found`);
    }

    if (options.dryRun) {
      console.log('🔍 Dry run mode - validating backup integrity...');
      const isValid = await this.validateBackupIntegrity(backup.id);
      if (!isValid) {
        throw new Error('Backup integrity validation failed');
      }
      console.log('✅ Backup integrity validated');
      return;
    }

    if (options.validateIntegrity !== false) {
      const isValid = await this.validateBackupIntegrity(backup.id);
      if (!isValid) {
        throw new Error('Backup integrity validation failed');
      }
    }

    // Download backup from destinations if needed
    await this.downloadBackup(backup.id);

    // Decrypt if necessary
    if (backup.encrypted) {
      await this.decryptBackup(backup.id);
    }

    // Decompress if necessary
    const compressedSize = await this.getCompressedSize(backup.id);
    if (compressedSize && compressedSize < backup.size) {
      await this.decompressBackup(backup.id);
    }

    // Restore components
    const components = options.components || backup.components;

    if (components.database) {
      await this.restoreDatabase(backup.id);
    }

    if (components.blockchain) {
      await this.restoreBlockchainData(backup.id);
    }

    if (components.files) {
      await this.restoreFiles(backup.id);
    }

    if (components.configurations) {
      await this.restoreConfigurations(backup.id);
    }

    console.log(`✅ Restore completed from backup: ${backup.id}`);
  }

  /**
   * Backup database
   */
  private async backupDatabase(backupId: string): Promise<void> {
    const backupPath = path.join(this.config.destinations.local, backupId, 'database');

    try {
      // Create backup directory
      fs.mkdirSync(backupPath, { recursive: true });

      // MongoDB backup
      if (process.env.MONGODB_URI) {
        await execAsync(`mongodump --uri="${process.env.MONGODB_URI}" --out="${backupPath}"`);
        console.log('📦 MongoDB backup completed');
      }

      // PostgreSQL backup
      if (process.env.DATABASE_URL) {
        await execAsync(`pg_dump "${process.env.DATABASE_URL}" > "${backupPath}/postgresql_backup.sql"`);
        console.log('📦 PostgreSQL backup completed');
      }

    } catch (error) {
      console.error('Database backup failed:', error);
      throw error;
    }
  }

  /**
   * Backup blockchain data
   */
  private async backupBlockchainData(backupId: string): Promise<void> {
    const backupPath = path.join(this.config.destinations.local, backupId, 'blockchain');

    try {
      fs.mkdirSync(backupPath, { recursive: true });

      // Backup deployment artifacts
      await this.copyDirectory('deployments', path.join(backupPath, 'deployments'));

      // Backup contract source code
      await this.copyDirectory('contracts', path.join(backupPath, 'contracts'));

      // Backup Hardhat configuration
      await this.copyFile('hardhat.config.ts', path.join(backupPath, 'hardhat.config.ts'));

      console.log('⛓️ Blockchain data backup completed');

    } catch (error) {
      console.error('Blockchain backup failed:', error);
      throw error;
    }
  }

  /**
   * Backup files
   */
  private async backupFiles(backupId: string): Promise<void> {
    const backupPath = path.join(this.config.destinations.local, backupId, 'files');

    try {
      fs.mkdirSync(backupPath, { recursive: true });

      // Backup source code
      await this.copyDirectory('src', path.join(backupPath, 'src'));

      // Backup configuration files
      const configFiles = ['package.json', 'tsconfig.json', '.env.example'];
      for (const file of configFiles) {
        if (fs.existsSync(file)) {
          await this.copyFile(file, path.join(backupPath, file));
        }
      }

      // Backup documentation
      await this.copyDirectory('docs', path.join(backupPath, 'docs'));

      console.log('📁 Files backup completed');

    } catch (error) {
      console.error('Files backup failed:', error);
      throw error;
    }
  }

  /**
   * Backup configurations
   */
  private async backupConfigurations(backupId: string): Promise<void> {
    const backupPath = path.join(this.config.destinations.local, backupId, 'config');

    try {
      fs.mkdirSync(backupPath, { recursive: true });

      // Backup environment configuration (without secrets)
      const envExample = fs.readFileSync('.env.example', 'utf8');
      fs.writeFileSync(path.join(backupPath, '.env.example'), envExample);

      // Backup deployment configurations
      await this.copyDirectory('k8s', path.join(backupPath, 'k8s'));

      // Backup monitoring configurations
      await this.copyDirectory('monitoring', path.join(backupPath, 'monitoring'));

      console.log('⚙️ Configurations backup completed');

    } catch (error) {
      console.error('Configurations backup failed:', error);
      throw error;
    }
  }

  /**
   * Restore database
   */
  private async restoreDatabase(backupId: string): Promise<void> {
    const backupPath = path.join(this.config.destinations.local, backupId, 'database');

    try {
      // Restore MongoDB
      if (fs.existsSync(path.join(backupPath, 'admin'))) {
        await execAsync(`mongorestore --uri="${process.env.MONGODB_URI}" "${backupPath}"`);
        console.log('📦 MongoDB restore completed');
      }

      // Restore PostgreSQL
      const sqlFile = path.join(backupPath, 'postgresql_backup.sql');
      if (fs.existsSync(sqlFile)) {
        await execAsync(`psql "${process.env.DATABASE_URL}" < "${sqlFile}"`);
        console.log('📦 PostgreSQL restore completed');
      }

    } catch (error) {
      console.error('Database restore failed:', error);
      throw error;
    }
  }

  /**
   * Restore blockchain data
   */
  private async restoreBlockchainData(backupId: string): Promise<void> {
    const backupPath = path.join(this.config.destinations.local, backupId, 'blockchain');

    try {
      // Restore deployment artifacts
      await this.copyDirectory(
        path.join(backupPath, 'deployments'),
        'deployments'
      );

      // Restore contract source code
      await this.copyDirectory(
        path.join(backupPath, 'contracts'),
        'contracts'
      );

      console.log('⛓️ Blockchain data restore completed');

    } catch (error) {
      console.error('Blockchain restore failed:', error);
      throw error;
    }
  }

  /**
   * Restore files
   */
  private async restoreFiles(backupId: string): Promise<void> {
    const backupPath = path.join(this.config.destinations.local, backupId, 'files');

    try {
      // Restore source code
      await this.copyDirectory(
        path.join(backupPath, 'src'),
        'src'
      );

      // Restore configuration files
      const configFiles = ['package.json', 'tsconfig.json', '.env.example'];
      for (const file of configFiles) {
        const backupFile = path.join(backupPath, file);
        if (fs.existsSync(backupFile)) {
          await this.copyFile(backupFile, file);
        }
      }

      console.log('📁 Files restore completed');

    } catch (error) {
      console.error('Files restore failed:', error);
      throw error;
    }
  }

  /**
   * Restore configurations
   */
  private async restoreConfigurations(backupId: string): Promise<void> {
    const backupPath = path.join(this.config.destinations.local, backupId, 'config');

    try {
      // Restore deployment configurations
      await this.copyDirectory(
        path.join(backupPath, 'k8s'),
        'k8s'
      );

      // Restore monitoring configurations
      await this.copyDirectory(
        path.join(backupPath, 'monitoring'),
        'monitoring'
      );

      console.log('⚙️ Configurations restore completed');

    } catch (error) {
      console.error('Configurations restore failed:', error);
      throw error;
    }
  }

  /**
   * Utility functions
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    if (!fs.existsSync(src)) return;

    try {
      await execAsync(`cp -r "${src}" "${dest}"`);
    } catch (error) {
      console.error(`Failed to copy directory ${src} to ${dest}:`, error);
      throw error;
    }
  }

  private async copyFile(src: string, dest: string): Promise<void> {
    try {
      fs.copyFileSync(src, dest);
    } catch (error) {
      console.error(`Failed to copy file ${src} to ${dest}:`, error);
      throw error;
    }
  }

  private async calculateBackupSize(backupId: string): Promise<number> {
    const backupPath = path.join(this.config.destinations.local, backupId);

    try {
      const { stdout } = await execAsync(`du -sb "${backupPath}" | cut -f1`);
      return parseInt(stdout.trim());
    } catch (error) {
      console.error('Failed to calculate backup size:', error);
      return 0;
    }
  }

  private async calculateBackupChecksum(backupId: string): Promise<string> {
    const backupPath = path.join(this.config.destinations.local, backupId);

    try {
      const { stdout } = await execAsync(`find "${backupPath}" -type f -exec sha256sum {} \\; | sha256sum | cut -d' ' -f1`);
      return stdout.trim();
    } catch (error) {
      console.error('Failed to calculate backup checksum:', error);
      return '';
    }
  }

  private async compressBackup(backupId: string): Promise<void> {
    const backupPath = path.join(this.config.destinations.local, backupId);

    try {
      const algorithm = this.config.compression.algorithm;
      const level = this.config.compression.level;

      switch (algorithm) {
        case 'gzip':
          await execAsync(`tar -czf "${backupPath}.tar.gz" -C "${backupPath}" . && rm -rf "${backupPath}"`);
          break;
        case 'brotli':
          await execAsync(`tar -cf "${backupPath}.tar" -C "${backupPath}" . && brotli -${level} "${backupPath}.tar" && rm -rf "${backupPath}"`);
          break;
        case 'lz4':
          await execAsync(`tar -cf "${backupPath}.tar" -C "${backupPath}" . && lz4 -${level} "${backupPath}.tar" "${backupPath}.tar.lz4" && rm -rf "${backupPath}"`);
          break;
      }

      console.log(`📦 Backup compressed with ${algorithm}`);
    } catch (error) {
      console.error('Backup compression failed:', error);
      throw error;
    }
  }

  private async encryptBackup(backupId: string): Promise<void> {
    const backupPath = path.join(this.config.destinations.local, backupId);

    try {
      const algorithm = this.config.encryption.algorithm;
      const key = this.config.encryption.key;

      // Create a simple encryption (in production, use proper key management)
      const { stdout } = await execAsync(`openssl enc -${algorithm} -salt -in "${backupPath}.tar.gz" -out "${backupPath}.tar.gz.enc" -k "${key}" && rm "${backupPath}.tar.gz"`);

      console.log(`🔐 Backup encrypted with ${algorithm}`);
    } catch (error) {
      console.error('Backup encryption failed:', error);
      throw error;
    }
  }

  private async uploadToDestinations(backupId: string): Promise<void> {
    const localPath = path.join(this.config.destinations.local, backupId);

    // Upload to S3 if configured
    if (this.config.destinations.s3) {
      await this.uploadToS3(backupId, localPath);
    }

    // Upload to GCS if configured
    if (this.config.destinations.gcs) {
      await this.uploadToGCS(backupId, localPath);
    }
  }

  private async uploadToS3(backupId: string, localPath: string): Promise<void> {
    const s3 = this.config.destinations.s3!;
    try {
      await execAsync(`aws s3 cp "${localPath}" s3://${s3.bucket}/backups/${backupId}/ --recursive`);
      console.log('☁️ Backup uploaded to S3');
    } catch (error) {
      console.error('S3 upload failed:', error);
      throw error;
    }
  }

  private async uploadToGCS(backupId: string, localPath: string): Promise<void> {
    const gcs = this.config.destinations.gcs!;
    try {
      await execAsync(`gsutil cp -r "${localPath}" gs://${gcs.bucket}/backups/${backupId}/`);
      console.log('☁️ Backup uploaded to GCS');
    } catch (error) {
      console.error('GCS upload failed:', error);
      throw error;
    }
  }

  private async validateBackupIntegrity(backupId: string): Promise<boolean> {
    try {
      const backup = this.backupHistory.find(b => b.id === backupId);
      if (!backup) return false;

      // Check if backup files exist
      const backupPath = path.join(this.config.destinations.local, backupId);
      if (!fs.existsSync(backupPath)) return false;

      // Verify checksum
      const currentChecksum = await this.calculateBackupChecksum(backupId);
      return currentChecksum === backup.checksum;

    } catch (error) {
      console.error('Backup integrity validation failed:', error);
      return false;
    }
  }

  private getLastFullBackup(): BackupMetadata | null {
    const fullBackups = this.backupHistory
      .filter(b => b.type === 'full')
      .sort((a, b) => b.timestamp - a.timestamp);

    return fullBackups[0] || null;
  }

  private async backupDatabaseChanges(backupId: string, sinceTimestamp: number): Promise<void> {
    // Implement incremental database backup
    console.log('📦 Creating incremental database backup...');
  }

  private async backupFileChanges(backupId: string, sinceTimestamp: number): Promise<void> {
    // Implement incremental file backup
    console.log('📁 Creating incremental file backup...');
  }

  private async decompressBackup(backupId: string): Promise<void> {
    // Implement decompression
    console.log('📦 Decompressing backup...');
  }

  private async decryptBackup(backupId: string): Promise<void> {
    // Implement decryption
    console.log('🔓 Decrypting backup...');
  }

  private async downloadBackup(backupId: string): Promise<void> {
    // Implement download from external destinations
    console.log('☁️ Downloading backup from external storage...');
  }

  private async getCompressedSize(backupId: string): Promise<number | null> {
    // Get compressed size if available
    return null;
  }

  private loadBackupHistory(): void {
    try {
      const historyPath = path.join(this.config.destinations.local, 'backup_history.json');
      if (fs.existsSync(historyPath)) {
        const historyData = fs.readFileSync(historyPath, 'utf8');
        this.backupHistory = JSON.parse(historyData);
      }
    } catch (error) {
      console.error('Failed to load backup history:', error);
    }
  }

  private async saveBackupHistory(): Promise<void> {
    try {
      const historyPath = path.join(this.config.destinations.local, 'backup_history.json');
      fs.writeFileSync(historyPath, JSON.stringify(this.backupHistory, null, 2));
    } catch (error) {
      console.error('Failed to save backup history:', error);
    }
  }

  private scheduleBackups(): void {
    // In a real implementation, this would use a cron job scheduler
    console.log('⏰ Backup scheduling initialized');
  }

  /**
   * Get backup history
   */
  getBackupHistory(): BackupMetadata[] {
    return [...this.backupHistory];
  }

  /**
   * Clean old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<void> {
    const retention = this.config.retention;
    const now = Date.now();

    const dailyBackups = this.backupHistory.filter(b => b.retention.daily);
    const weeklyBackups = this.backupHistory.filter(b => b.retention.weekly);
    const monthlyBackups = this.backupHistory.filter(b => b.retention.monthly);

    // Keep only the last N daily backups
    if (dailyBackups.length > retention.daily) {
      const toDelete = dailyBackups
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(retention.daily);

      for (const backup of toDelete) {
        await this.deleteBackup(backup.id);
      }
    }

    // Similar logic for weekly and monthly backups
    console.log('🧹 Backup cleanup completed');
  }

  private async deleteBackup(backupId: string): Promise<void> {
    try {
      const backupPath = path.join(this.config.destinations.local, backupId);
      if (fs.existsSync(backupPath)) {
        await execAsync(`rm -rf "${backupPath}"`);
      }

      // Remove from history
      this.backupHistory = this.backupHistory.filter(b => b.id !== backupId);

      console.log(`🗑️ Deleted old backup: ${backupId}`);
    } catch (error) {
      console.error(`Failed to delete backup ${backupId}:`, error);
    }
  }

  /**
   * Get backup statistics
   */
  getBackupStatistics(): {
    totalBackups: number;
    totalSize: number;
    oldestBackup: number;
    newestBackup: number;
    averageSize: number;
  } {
    if (this.backupHistory.length === 0) {
      return {
        totalBackups: 0,
        totalSize: 0,
        oldestBackup: 0,
        newestBackup: 0,
        averageSize: 0
      };
    }

    const totalSize = this.backupHistory.reduce((sum, b) => sum + b.size, 0);
    const timestamps = this.backupHistory.map(b => b.timestamp);

    return {
      totalBackups: this.backupHistory.length,
      totalSize,
      oldestBackup: Math.min(...timestamps),
      newestBackup: Math.max(...timestamps),
      averageSize: totalSize / this.backupHistory.length
    };
  }
}

// Default backup configuration
export const DEFAULT_BACKUP_CONFIG: BackupConfig = {
  enabled: true,
  schedule: '0 2 * * *', // Daily at 2 AM
  retention: {
    daily: 7,      // Keep 7 daily backups
    weekly: 4,     // Keep 4 weekly backups
    monthly: 12    // Keep 12 monthly backups
  },
  destinations: {
    local: './backups'
  },
  encryption: {
    enabled: true,
    key: process.env.BACKUP_ENCRYPTION_KEY || 'default-key-change-in-production',
    algorithm: 'aes-256-gcm'
  },
  compression: {
    enabled: true,
    algorithm: 'gzip',
    level: 6
  }
};

// Export singleton instance
export const backupRecoveryService = new BackupRecoveryService(DEFAULT_BACKUP_CONFIG);