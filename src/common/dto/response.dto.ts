export class ResponseDto<T> {
  data: T;
  message: string;
  statusCode: number;

  constructor(data: T, message: string, statusCode: number) {
    this.data = data;
    this.message = message;
    this.statusCode = statusCode;
  }

  static of<T>(data: T, message: string, statusCode: number): ResponseDto<T> {
    return new ResponseDto(data, message, statusCode);
  }
}
