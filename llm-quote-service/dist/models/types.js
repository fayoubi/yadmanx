// ====================================================================================
// Conversation State Types
// ====================================================================================
export var ConversationStatus;
(function (ConversationStatus) {
    ConversationStatus["COLLECTING"] = "collecting";
    ConversationStatus["CONFIRMING"] = "confirming";
    ConversationStatus["CALCULATING"] = "calculating";
    ConversationStatus["COMPLETE"] = "complete";
    ConversationStatus["ERROR"] = "error";
})(ConversationStatus || (ConversationStatus = {}));
export var ConversationField;
(function (ConversationField) {
    ConversationField["GENDER"] = "gender";
    ConversationField["DATE_OF_BIRTH"] = "dateOfBirth";
    ConversationField["HEIGHT"] = "height";
    ConversationField["WEIGHT"] = "weight";
    ConversationField["CITY"] = "city";
    ConversationField["USES_NICOTINE"] = "usesNicotine";
    ConversationField["TERM_LENGTH"] = "termLength";
})(ConversationField || (ConversationField = {}));
// ====================================================================================
// UI Helper Types
// ====================================================================================
export var InputType;
(function (InputType) {
    InputType["TEXT"] = "text";
    InputType["DATE"] = "date";
    InputType["NUMBER"] = "number";
    InputType["DROPDOWN"] = "dropdown";
    InputType["QUICK_REPLY"] = "quick_reply";
})(InputType || (InputType = {}));
//# sourceMappingURL=types.js.map