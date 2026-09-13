import { KNOWLEDGE_RULES } from "@/data/rules";

/** The backend has no knowledge route yet; this keeps the future API boundary typed. */
export function getKnowledge() { return Promise.resolve(KNOWLEDGE_RULES); }
