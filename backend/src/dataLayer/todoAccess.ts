import { TodoItem } from '../models/TodoItem'
import * as AWS from 'aws-sdk'
import 'source-map-support/register'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const AWSXRay = require('aws-xray-sdk')

const XAWS = AWSXRay.captureAWS(AWS)

export class TodoAccess {
    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly table = process.env.TODOS_TABLE,
        private readonly index = process.env.INDEX_NAME) {

    }

    async addTodo(todoItem: TodoItem) {
        await this.docClient.put({
            TableName: this.table,
            Item: todoItem
        }).promise();
    }

    async deleteTodo(todoId: string, userId: string) {
        await this.docClient.delete({
            TableName: this.table,
            Key: {
                todoId,
                userId
            }
        }).promise();
    }

    async getTodo(todoId: string, userId: string) {
        const result = await this.docClient.get({
            TableName: this.table,
            Key: {
                todoId,
                userId
            }
        }).promise();

        return result.Item;
    }

    async getAllTodos(userId: string){
        console.log("Getting all Todos")

        const result = await this.docClient.query({
            TableName: this.table,
            IndexName: this.index,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise();

        return result.Items;
    }

    async createTodo(todo: TodoItem): Promise<TodoItem> {
        console.log(`Creating a todo with id ${todo.todoId}`)

       await this.docClient.put({
            TableName: this.table,
            Item: todo
        }).promise()

        return todo
    }

    async updateTodo(todoId: string, userId: string, updatedTodo) {
        const updateTodo = await this.docClient.update({
            TableName: this.table,
            Key: {
                todoId,
                userId
            },
            UpdateExpression: 'set #name = :n, #dueDate = :due, #done = :d',
            ExpressionAttributeValues: {
                ':n': updatedTodo.name,
                ':due': updatedTodo.dueDate,
                ':d': updatedTodo.done
            },
            ExpressionAttributeNames: {
                '#name': 'name',
                '#dueDate': 'dueDate',
                '#done': 'done'
            }
        }).promise();

        return updateTodo
    }
}


function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
        console.log('Creating a local DynamoDB instance')
        return new XAWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        })
    }

    return new XAWS.DynamoDB.DocumentClient()
}