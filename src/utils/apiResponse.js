class ApiResponse{
    constructor(statusCode,message ='Success',success=true,data={}){
        this.statusCode = statusCode < 400;
        this.message = message;
        this.success = success;
        this.data = data;
    }
}