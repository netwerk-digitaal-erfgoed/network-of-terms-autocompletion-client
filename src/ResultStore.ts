import { Quad } from "rdf-js";

import ResultEmitter from "./ResultEmitter";
import N3 = require('n3');
import ResultMetadata from "./ResultMetadata";

/*
 * Intercepts all data from the subEmitter, and only reemits the literal quads
 * Clients can then request everything we know about a given subject using the resolveSubject method
 */ 
export default class ResultStore extends ResultEmitter {
    protected subEmitter: ResultEmitter;
    protected store: N3.Store;

    constructor(sourceAgents: ResultEmitter) {
        super();
        this.subEmitter = sourceAgents;
        this.store = new N3.Store();

        const self = this;
        this.subEmitter.on("data", (q, meta) => self.processQuad(q, meta));
        this.subEmitter.on("end", (meta) => self.emit("end", meta));
    }

    public async query(input: string) {
        this.emit("reset", new ResultMetadata(input));
        this.store = new N3.Store();
        this.subEmitter.query(input);
    }

    public resolveSubject(uri: string): Quad[] {
        return this.store.getQuads(uri, null, null, null);
    }

    protected processQuad(quad: Quad, meta: ResultMetadata) {
        this.store.addQuad(quad);
        if (quad.object.termType == "Literal" && quad.subject.termType === "NamedNode") {
            const dataType = quad.object.datatype.value;

            if (dataType == "http://www.w3.org/2001/XMLSchema#string" || dataType == "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString") {
                this.emit("data", quad, meta);
            }
        }
    }
}
