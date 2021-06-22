import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoAccess } from '../dataLayer/todoAccess';
import { getUserId } from '../lambda/utils';
import { CreateTodoRequest } from '../requests/CreateTodoRequest';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';
import TodoStorage from '../dataLayer/todoStorage';




const todoAccess = new TodoAccess()
const todoStorage = new TodoStorage()

export async function getAllTodos(event: APIGatewayProxyEvent) {
    const userId = getUserId(event)
    return todoAccess.getAllTodos(userId)
}

export async function getTodo(event: APIGatewayProxyEvent) {
    const todoId = event.pathParameters.todoId;
    const userId = getUserId(event);

    return await todoAccess.getTodo(todoId, userId);
}



export async function createTodo(event: APIGatewayProxyEvent,
    createTodoRequest: CreateTodoRequest): Promise<TodoItem> {
    const todoId = uuid.v4();
    const userId = getUserId(event);
    const createdAt = new Date(Date.now()).toISOString();

    const todoItem = {
        userId,
        todoId,
        createdAt,
        done: false,
        attachmentUrl: `https://${todoStorage.getBucketName()}.s3.amazonaws.com/${todoId}`,
        ...createTodoRequest
    };

    await todoAccess.createTodo(todoItem);

    return todoItem;
}

export async function updateTodo(event: APIGatewayProxyEvent,
    updateTodoRequest: UpdateTodoRequest) {
    const todoId = event.pathParameters.todoId;
    const userId = getUserId(event);

    if (!(await todoAccess.getTodo(todoId, userId))) {
        return false;
    }

    await todoAccess.updateTodo(todoId, userId, updateTodoRequest);

    return true;
}

export async function deleteTodo(event: APIGatewayProxyEvent) {
    const todoId = event.pathParameters.todoId;
    const userId = getUserId(event);
  
    if (!(await todoAccess.getTodo(todoId, userId))) {
      return false;
    }
  
    await todoAccess.deleteTodo(todoId, userId);
  
    return true;
  }


  export async function generateUploadUrl(event: APIGatewayProxyEvent) {
    const bucket = todoStorage.getBucketName();
    const urlExpiration = process.env.SIGNED_URL_EXPIRATION;
    const todoId = event.pathParameters.todoId;
  
    const createSignedUrlRequest = {
      Bucket: bucket,
      Key: todoId,
      Expires: urlExpiration
    }
  
    return todoStorage.getPresignedUploadURL(createSignedUrlRequest);
  }
  

