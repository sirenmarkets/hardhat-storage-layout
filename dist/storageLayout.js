"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageLayout = void 0;
const fs_1 = __importDefault(require("fs"));
const plugins_1 = require("hardhat/plugins");
const path_1 = __importDefault(require("path"));
const prettifier_1 = require("./prettifier");
require("./type-extensions");
class StorageLayout {
    constructor(hre) {
        this.env = hre;
    }
    async export() {
        var _a, _b, _c, _d, _e, _f;
        const storageLayoutPath = this.env.config.paths.newStorageLayoutPath;
        const outputDirectory = path_1.default.resolve(storageLayoutPath);
        if (!outputDirectory.startsWith(this.env.config.paths.root)) {
            throw new plugins_1.HardhatPluginError("output directory should be inside the project directory");
        }
        if (!fs_1.default.existsSync(outputDirectory)) {
            fs_1.default.mkdirSync(outputDirectory);
        }
        const buildInfos = await this.env.artifacts.getBuildInfoPaths();
        const artifactsPath = this.env.config.paths.artifacts;
        const artifacts = buildInfos.map((source, idx) => {
            const artifact = fs_1.default.readFileSync(source);
            return {
                idx,
                source: source.startsWith(artifactsPath)
                    ? source.slice(artifactsPath.length)
                    : source,
                data: JSON.parse(artifact.toString())
            };
        });
        const names = [];
        for (const fullName of await this.env.artifacts.getAllFullyQualifiedNames()) {
            const { sourceName, contractName } = await this.env.artifacts.readArtifact(fullName);
            names.push({ sourceName, contractName });
        }
        names.sort((a, b) => a.contractName.localeCompare(b.contractName));
        const data = { contracts: [] };
        for (const { sourceName, contractName } of names) {
            for (const artifactJsonABI of artifacts) {
                const storage = (_e = (_d = (_c = (_b = (_a = artifactJsonABI.data.output) === null || _a === void 0 ? void 0 : _a.contracts) === null || _b === void 0 ? void 0 : _b[sourceName]) === null || _c === void 0 ? void 0 : _c[contractName]) === null || _d === void 0 ? void 0 : _d.storageLayout) === null || _e === void 0 ? void 0 : _e.storage;
                if (!storage) {
                    continue;
                }
                const contract = { name: contractName, stateVariables: [] };
                for (const stateVariable of storage) {
                    contract.stateVariables.push({
                        name: stateVariable.label,
                        slot: stateVariable.slot,
                        offset: stateVariable.offset,
                        type: stateVariable.type,
                        idx: artifactJsonABI.idx,
                        artifact: artifactJsonABI.source,
                        numberOfBytes: (_f = artifactJsonABI.data.output) === null || _f === void 0 ? void 0 : _f.contracts[sourceName][contractName].storageLayout.types[stateVariable.type].numberOfBytes
                    });
                }
                data.contracts.push(contract);
                const output = JSON.parse(JSON.stringify(data));
                for (const contract of output.contracts) {
                    for (const stateVariable of contract.stateVariables) {
                        delete stateVariable.idx;
                        delete stateVariable.artifact;
                    }
                }
                // TODO: export the storage layout to the ./storageLayout/output.md
                fs_1.default.writeFileSync(outputDirectory + "/output.json", JSON.stringify(output, null, 2).concat('\n'));
            }
        }
        const prettifier = new prettifier_1.Prettify(data.contracts);
        prettifier.tabulate();
    }
}
exports.StorageLayout = StorageLayout;
//# sourceMappingURL=storageLayout.js.map