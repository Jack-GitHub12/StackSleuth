interface InitOptions {
    framework: 'react' | 'express' | 'nextjs';
    typescript: boolean;
}
export declare class InitCommand {
    execute(options: InitOptions): Promise<void>;
    private gatherConfig;
    private createConfigFiles;
    private generateConfigFile;
    private createExampleCode;
    private createExpressExample;
    private createReactExample;
    private createNextExample;
    private showSetupInstructions;
}
export {};
//# sourceMappingURL=init.d.ts.map