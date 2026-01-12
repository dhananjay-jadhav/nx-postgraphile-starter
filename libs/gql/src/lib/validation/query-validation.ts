/**
 * GraphQL Query Validation
 *
 * Provides depth limiting and cost analysis for GraphQL queries
 * to prevent resource exhaustion attacks.
 */

import type {
    DocumentNode,
    FieldNode,
    FragmentDefinitionNode,
    SelectionNode,
    SelectionSetNode,
} from 'graphql';

/**
 * Validation result for a GraphQL query
 */
export interface ValidationResult {
    valid: boolean;
    depth: number;
    cost: number;
    errors: string[];
}

/**
 * Options for query validation
 */
export interface ValidationOptions {
    maxDepth: number;
    maxCost: number;
}

/**
 * Calculate the depth of a GraphQL query
 */
export function calculateQueryDepth(
    document: DocumentNode,
    fragments: Record<string, FragmentDefinitionNode> = {}
): number {
    // Build fragments map if not provided
    if (Object.keys(fragments).length === 0) {
        for (const definition of document.definitions) {
            if (definition.kind === 'FragmentDefinition') {
                fragments[definition.name.value] = definition;
            }
        }
    }

    let maxDepth = 0;

    for (const definition of document.definitions) {
        if (definition.kind === 'OperationDefinition') {
            const depth = calculateSelectionSetDepth(definition.selectionSet, fragments, 0);
            maxDepth = Math.max(maxDepth, depth);
        }
    }

    return maxDepth;
}

/**
 * Calculate depth of a selection set recursively
 */
function calculateSelectionSetDepth(
    selectionSet: SelectionSetNode,
    fragments: Record<string, FragmentDefinitionNode>,
    currentDepth: number
): number {
    let maxDepth = currentDepth;

    for (const selection of selectionSet.selections) {
        const depth = calculateSelectionDepth(selection, fragments, currentDepth);
        maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth;
}

/**
 * Calculate depth of a single selection
 */
function calculateSelectionDepth(
    selection: SelectionNode,
    fragments: Record<string, FragmentDefinitionNode>,
    currentDepth: number
): number {
    if (selection.kind === 'Field') {
        const fieldNode = selection as FieldNode;
        if (fieldNode.selectionSet) {
            return calculateSelectionSetDepth(fieldNode.selectionSet, fragments, currentDepth + 1);
        }
        return currentDepth + 1;
    }

    if (selection.kind === 'InlineFragment') {
        if (selection.selectionSet) {
            return calculateSelectionSetDepth(selection.selectionSet, fragments, currentDepth);
        }
        return currentDepth;
    }

    if (selection.kind === 'FragmentSpread') {
        const fragment = fragments[selection.name.value];
        if (fragment?.selectionSet) {
            return calculateSelectionSetDepth(fragment.selectionSet, fragments, currentDepth);
        }
        return currentDepth;
    }

    return currentDepth;
}

/**
 * Estimate the cost of a GraphQL query
 * Simple heuristic based on:
 * - 1 point per field
 * - 10 points per connection/list field
 * - Multiplied by list size arguments (first, last)
 */
export function estimateQueryCost(document: DocumentNode): number {
    let cost = 0;

    // Build fragments map
    const fragments: Record<string, FragmentDefinitionNode> = {};
    for (const definition of document.definitions) {
        if (definition.kind === 'FragmentDefinition') {
            fragments[definition.name.value] = definition;
        }
    }

    for (const definition of document.definitions) {
        if (definition.kind === 'OperationDefinition') {
            cost += calculateSelectionSetCost(definition.selectionSet, fragments);
        }
    }

    return cost;
}

/**
 * Calculate cost of a selection set
 */
function calculateSelectionSetCost(
    selectionSet: SelectionSetNode,
    fragments: Record<string, FragmentDefinitionNode>
): number {
    let cost = 0;

    for (const selection of selectionSet.selections) {
        cost += calculateSelectionCost(selection, fragments);
    }

    return cost;
}

/**
 * Calculate cost of a single selection
 */
function calculateSelectionCost(
    selection: SelectionNode,
    fragments: Record<string, FragmentDefinitionNode>
): number {
    if (selection.kind === 'Field') {
        const fieldNode = selection as FieldNode;
        let fieldCost = 1;

        // Check if this is a connection/list field
        const fieldName = fieldNode.name.value;
        const isConnection = fieldName.endsWith('Connection') || fieldName.endsWith('s');

        if (isConnection) {
            fieldCost = 10;

            // Check for pagination arguments (first, last)
            const firstArg = fieldNode.arguments?.find(a => a.name.value === 'first');
            const lastArg = fieldNode.arguments?.find(a => a.name.value === 'last');

            if (firstArg?.value.kind === 'IntValue') {
                fieldCost *= Math.min(parseInt(firstArg.value.value, 10), 100);
            } else if (lastArg?.value.kind === 'IntValue') {
                fieldCost *= Math.min(parseInt(lastArg.value.value, 10), 100);
            } else {
                // Default multiplier for unbounded lists
                fieldCost *= 10;
            }
        }

        // Recurse into nested selections
        if (fieldNode.selectionSet) {
            fieldCost += calculateSelectionSetCost(fieldNode.selectionSet, fragments);
        }

        return fieldCost;
    }

    if (selection.kind === 'InlineFragment') {
        if (selection.selectionSet) {
            return calculateSelectionSetCost(selection.selectionSet, fragments);
        }
        return 0;
    }

    if (selection.kind === 'FragmentSpread') {
        const fragment = fragments[selection.name.value];
        if (fragment?.selectionSet) {
            return calculateSelectionSetCost(fragment.selectionSet, fragments);
        }
        return 0;
    }

    return 0;
}

/**
 * Validate a GraphQL document against depth and cost limits
 */
export function validateQuery(
    document: DocumentNode,
    options: ValidationOptions = { maxDepth: 10, maxCost: 1000 }
): ValidationResult {
    const errors: string[] = [];
    const depth = calculateQueryDepth(document);
    const cost = estimateQueryCost(document);

    const { maxDepth, maxCost } = options;

    if (depth > maxDepth) {
        errors.push(`Query depth of ${depth} exceeds maximum allowed depth of ${maxDepth}`);
    }

    if (cost > maxCost) {
        errors.push(`Query cost of ${cost} exceeds maximum allowed cost of ${maxCost}`);
    }

    return {
        valid: errors.length === 0,
        depth,
        cost,
        errors,
    };
}
