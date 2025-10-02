export type CSVRow = { [key: string]: string | number };

export type Operator = '===' | '!==' | '>' | '<' | '>=' | '<=' | 'contains' | '!contains';

export interface FilterCondition {
  header: string;
  operator: Operator;
  value: string | number;
}