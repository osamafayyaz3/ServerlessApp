import { TodoItem } from '../models/TodoItem'
import * as AWS from 'aws-sdk'
import 'source-map-support/register'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const AWSXRay = require('aws-xray-sdk')

const XAWS = AWSXRay.captureAWS(AWS)

export class TodoAccess {
    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todoTable = process.env.TODOS_TABLE,
        private readonly indexName = process.env.INDEX_NAME) {

    }


    async addTodo(todoItem) {
        await this.docClient.put({
            TableName: this.todoTable,
            Item: todoItem
        }).promise();
    }

    async deleteTodo(todoId, userId) {
        await this.docClient.delete({
            TableName: this.todoTable,
            Key: {
                todoId,
                userId
            }
        }).promise();
    }

    async getTodo(todoId, userId) {
        const result = await this.docClient.get({
            TableName: this.todoTable,
            Key: {
                todoId,
                userId
            }
        }).promise();

        return result.Item;
    }

    async getAllTodos(userId): Promise<TodoItem[]> {
        console.log("Getting all Todos")

        const result = await this.docClient.query({
            TableName: this.todoTable,
            IndexName: this.indexName,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise();

        const items = result.Items
        return items as TodoItem[]
    }

    async createTodo(todo: TodoItem): Promise<TodoItem> {
        console.log(`Creating a todo with id ${todo.todoId}`)

        await this.docClient.put({
            TableName: this.todoTable,
            Item: todo
        }).promise()

        return todo
    }

    async updateTodo(todoId, userId, updatedTodo) {
        await this.docClient.update({
            TableName: this.todoTable,
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