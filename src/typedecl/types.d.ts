declare interface Information {
    name: string;
    nickname?: string;
    author: {
        name: string;
        link: string;
    };
    repository: {
        name: string;
        link: string;
        branch?: string;
    };
    type: string;
}

declare const packageDir: string;

type Or<V extends ((keyof A) & (keyof B)), A, B> =
    ({ [key: V]: boolean }) &
    ({ [key: V]: false } & A) &
    ({ [key: V]: true } & B);
declare namespace Selcon {
    import typescript from "typescript";
    declare namespace WebscriptState {
        interface Hosts {
            compiler: typescript.CompilerHost;
        }
        interface _IsCompiled {
            compiled: boolean;
            result: string;
        }
        type IsCompiled = Or<"compiled", Partial<IsCompiled>, IsCompiled>;
    }

    type InitialisedWebscriptState = {
        initialised: boolean;
        hosts: WebscriptState.Hosts;
    } & WebscriptState.IsCompiled;
    type WebscriptState = Or<"initialised", Partial<InitialisedWebscriptState>, InitialisedWebscriptState>;


    export type CommandName = "help" | "build";
    export interface Options {
        command: CommandName;
        /**
         * Whether or not debug (DBG) logs should be enabled.
         */
        verbose: boolean;
        /**
         * Whether or not to enable debug features for produced outputs.
         */
        debug: boolean;
    }
}
declare const webscriptState: Selcon.WebscriptState;
declare const selconOptions: Selcon.Options;
