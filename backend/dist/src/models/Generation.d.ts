export interface Generation {
    id: string;
    user_id: number;
    prompt: string;
    style: string;
    image_path?: string;
    result_image_path?: string;
    status: 'processing' | 'completed' | 'failed';
    created_at: string;
}
export interface CreateGenerationData {
    id: string;
    user_id: number;
    prompt: string;
    style: string;
    image_path?: string;
}
export declare class GenerationModel {
    static create(generationData: CreateGenerationData): Promise<Generation>;
    static findById(id: string): Promise<Generation>;
    static findByUserId(userId: number, limit?: number): Promise<Generation[]>;
    static updateStatus(id: string, status: Generation['status'], resultImagePath?: string): Promise<Generation>;
    static delete(id: string): Promise<void>;
}
//# sourceMappingURL=Generation.d.ts.map