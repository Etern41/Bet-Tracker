/**
 * Общие классы для полей ввода и селектов (формы, фильтры).
 * Одна точка правды — меньше дублирования и расхождений по стилю.
 */

/** Блок label + control в модалках: не раздувает flex/grid по ширине */
export const FORM_FIELD_STACK = "min-w-0 max-w-full space-y-2";

export const FORM_INPUT =
  "h-9 min-w-0 max-w-full overflow-x-hidden px-3 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring dark:bg-input/45";

export const FORM_INPUT_TEXT = `${FORM_INPUT} break-all`;

/** Инпуты в панели фильтров и похожих компактных рядах */
export const FORM_FILTER_CONTROL =
  "h-9 w-full min-w-0 border-border bg-background text-foreground dark:bg-input/40";

/** Триггер Select в форме ставки */
export const FORM_SELECT_TRIGGER = "h-9 w-full min-w-0 px-3 font-normal";

export const FORM_TEXTAREA =
  "min-h-[80px] min-w-0 max-w-full border border-input rounded-md bg-background text-foreground dark:bg-input/45";
