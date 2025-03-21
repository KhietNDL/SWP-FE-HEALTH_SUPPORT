import { Answer } from './Answer';

export interface Question {
    id: string;
    contentQ: string;
    answerList: Answer[];
    isDelete: boolean;
  }