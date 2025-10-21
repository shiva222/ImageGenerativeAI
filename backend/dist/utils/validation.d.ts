import { z } from 'zod';
export declare const signupSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const createGenerationSchema: z.ZodObject<{
    prompt: z.ZodString;
    style: z.ZodEnum<{
        realistic: "realistic";
        artistic: "artistic";
        cartoon: "cartoon";
        vintage: "vintage";
    }>;
}, z.core.$strip>;
export declare const getGenerationsSchema: z.ZodObject<{
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
}, z.core.$strip>;
export declare const validateImageFile: (file: Express.Multer.File) => string | null;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateGenerationInput = z.infer<typeof createGenerationSchema>;
export type GetGenerationsInput = z.infer<typeof getGenerationsSchema>;
//# sourceMappingURL=validation.d.ts.map