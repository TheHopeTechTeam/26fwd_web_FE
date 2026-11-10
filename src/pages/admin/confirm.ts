/** What a reviewer types before a delete goes through, so no card is deleted by a stray click (#35, Ian 11/02). */
export const DELETE_WORD = '刪除';

export const deleteConfirmed = (typed: string) => typed.trim() === DELETE_WORD;
