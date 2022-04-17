import * as anchor from "@project-serum/anchor";
import {Program, Provider} from "@project-serum/anchor";
import shantiesIDL from "../lib/idl/shanties_idl.json";

export function getShantiesProgram(provider: Provider) {
    return new Program(shantiesIDL as anchor.Idl, process.env.NEXT_PUBLIC_SHANTIES_PROGRAM as string, provider);
}
