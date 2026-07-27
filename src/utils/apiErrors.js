class ApiError extends Error {
    constructor(
        statusCode,
        message= "Something went wrong",
        error= [],
        stack= ""
    ){
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.success = false;
        this.error = error;
        this.stack = stack;
    }
}

export default ApiError;