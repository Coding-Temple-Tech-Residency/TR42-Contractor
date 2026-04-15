export class InitMessage{

    static messageId = 0;

    constructor(){

        InitMessage.messageId++;
    }

    static getMessageId(){
        InitMessage.messageId++;
        return(InitMessage.messageId)
    }
}