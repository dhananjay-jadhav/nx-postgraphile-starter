/**
 * WrapPlan Type Utilities
 * 
 * Shared type definitions for PostGraphile wrapPlan functions.
 * Import these in your wrapPlan libraries.
 * 
 * @see https://postgraphile.org/postgraphile/next/migrating-from-v4/make-wrap-resolvers-plugin
 */
import type { ExecutableStep, FieldArgs, FieldInfo } from 'grafast';

// Re-export types for convenience
export type { ExecutableStep, FieldArgs, FieldInfo };

/**
 * Generic WrapPlan function type
 * 
 * @template TResult - The return type of the plan
 * 
 * @example
 * ```typescript
 * import type { WrapPlanFn } from '@app/gql';
 * 
 * const myWrapPlan: WrapPlanFn<User | null> = (plan, $source, fieldArgs, info) => {
 *     // Custom logic here
 *     return plan(); // Call the original plan
 * };
 * ```
 */
export type WrapPlanFn<TResult> = (
    plan: () => ExecutableStep<TResult>,
    $source: ExecutableStep,
    fieldArgs: FieldArgs,
    info: FieldInfo
) => ExecutableStep<TResult>;
