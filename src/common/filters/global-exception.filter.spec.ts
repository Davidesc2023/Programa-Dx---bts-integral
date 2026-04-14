import { ArgumentsHost, ConflictException, HttpStatus, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GlobalExceptionFilter } from './global-exception.filter';

const mockJson = jest.fn();
const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
const mockGetRequest = jest.fn().mockReturnValue({ url: '/test' });

const mockHost = {
  switchToHttp: () => ({
    getResponse: mockGetResponse,
    getRequest: mockGetRequest,
  }),
} as unknown as ArgumentsHost;

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
  });

  it('mapea HttpException al status y mensaje correcto', () => {
    filter.catch(new NotFoundException('Paciente no encontrado'), mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, message: 'Paciente no encontrado' }),
    );
  });

  it('mapea Prisma P2002 a 409 Conflict', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: '5.0.0',
    });

    filter.catch(prismaError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409, message: 'El recurso ya existe' }),
    );
  });

  it('mapea Prisma P2025 a 404 Not Found', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '5.0.0',
    });

    filter.catch(prismaError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, message: 'El recurso no fue encontrado' }),
    );
  });

  it('mapea error genérico a 500', () => {
    filter.catch(new Error('Unexpected'), mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, message: 'Error interno del servidor' }),
    );
  });

  it('no incluye stack trace en producción', () => {
    process.env.NODE_ENV = 'production';

    filter.catch(new ConflictException('Conflicto'), mockHost);

    expect(mockJson).toHaveBeenCalledWith(
      expect.not.objectContaining({ stack: expect.anything() }),
    );
  });
});
