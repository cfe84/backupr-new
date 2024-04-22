import { EnvironmentConfigurationProvider } from "../config/EnvironmentConfigurationProvider";
import { Logger } from "../config/Logger";
import { ImmichStorageService } from "../immich/ImmichStorageService";
import { IStorageService } from "./IStorageService";

export class StorageServiceFactory {
  constructor(private configProvider: EnvironmentConfigurationProvider, private logger: Logger) {

  }

  getStorageService(): IStorageService {
    if (this.configProvider.getStorageService() === "immich") {
      const config = this.configProvider.getImmichConfig();
      return new ImmichStorageService(this.configProvider.getStore(), config, this.logger);
    }
    throw Error("No STORAGE_SERVICE configured.");
  }
}