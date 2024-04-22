import * as dotenv from "dotenv"
dotenv.config()

import { exit } from "process";
import { EnvironmentConfigurationProvider } from "./config/EnvironmentConfigurationProvider";
import { FileMediaLibrary } from "./mediaLibrary/FileMediaLibrary";
import { FileMediaStore, FileMediaStoreConfig } from "./mediaLibrary/FileMediaStore";
import path from "path";
import { Logger } from "./config/Logger";
import { Uploader } from "./processor/Uploader";
import { StorageServiceFactory } from "./services/StorageServiceFactory";

const configurationProvider = new EnvironmentConfigurationProvider()

const logger = new Logger("debug")
const storePath = configurationProvider.getStore()
if (!storePath) {
  console.error(`Add REPOSITORY= to your env`)
  exit(1)
}
const library = FileMediaLibrary.load<any, any>(storePath)
const storageServiceFactory = new StorageServiceFactory(configurationProvider, logger);
const storageService = storageServiceFactory.getStorageService();

async function run() {
  const processor = new Uploader(storageService, library, logger)
  await processor.processAsync()
}
run().finally()