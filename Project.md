# PROJECT NAME

RepoMind

AI-Powered Engineering Memory & Project Intelligence Platform

------------------------------------------------------------

## PRODUCT VISION

RepoMind is an AI Engineering Assistant designed to become the permanent memory of every software project.

Today's developers constantly switch between GitHub repositories, README files, documentation, Issues, Pull Requests, Slack messages, TODO comments, architecture diagrams and AI chatbots just to understand a project.

When a developer returns to a repository after weeks or months, they often forget:

• Why was this feature implemented?
• Where is authentication handled?
• Which file contains JWT verification?
• How does the request flow work?
• Which API calls this service?
• Which issue is currently blocked?
• Which documentation is outdated?
• Which files are unused?

Current AI assistants like ChatGPT, Gemini and Claude are extremely powerful but they are not continuously aware of an entire software project.

They only understand what the user pastes into the prompt.

This causes repeated explanations, loss of context and poor long-term project memory.

RepoMind solves this problem.

------------------------------------------------------------

## OBJECTIVE

Build an AI Engineering Platform capable of understanding an entire software project instead of individual files.

The platform should continuously analyze a GitHub repository and provide intelligent answers based on the complete codebase.

The AI should become an Engineering Teammate rather than just another chatbot.

The platform should focus on understanding projects instead of generating random code.

------------------------------------------------------------

## TARGET USERS

• Software Engineers
• Full Stack Developers
• Open Source Contributors
• Engineering Teams
• Tech Leads
• Students
• Freelancers

------------------------------------------------------------

## CORE PROBLEM

Software project knowledge is fragmented.

Information exists across:

GitHub Repository

Source Code

README

Issues

Pull Requests

Commit History

Folder Structure

Architecture

Documentation

API Endpoints

TODO Comments

Developers waste significant time searching through repositories instead of building software.

RepoMind centralizes all engineering knowledge into one AI system.

------------------------------------------------------------

## SOLUTION

Users connect their GitHub repository using GitHub OAuth.

RepoMind automatically indexes the repository.

The system analyzes

• Folder structure

• Source code

• Dependencies

• Components

• Services

• Controllers

• Models

• APIs

• Commit history

• Pull Requests

• Issues

• Documentation

The repository is converted into structured knowledge using vector embeddings.

Every user query is answered using the indexed repository rather than relying on the model's memory.

------------------------------------------------------------

## AI PHILOSOPHY

The AI should NEVER hallucinate.

If information does not exist inside the repository,

the AI must clearly state

"I could not find verified information inside this repository."

The AI should never invent

• APIs

• Files

• Components

• Database models

• Routes

• Documentation

• Commit history

Every answer should include references to actual files whenever possible.

------------------------------------------------------------

## CORE AI AGENTS

The application consists of multiple specialized AI agents coordinated by one central coordinator.

Coordinator Agent

Receives every request.

Detects user intent.

Delegates the request to the appropriate specialized agent.

Combines responses.

Returns one final answer.

------------------------------------------------------------

Code Memory Agent

Responsible for understanding the repository.

Capabilities

• Explain files

• Explain functions

• Explain classes

• Explain authentication

• Explain architecture

• Explain dependencies

• Search code semantically

• Navigate repository

------------------------------------------------------------

Documentation Agent

Responsible for automatically generating and maintaining documentation.

Capabilities

• README

• API Documentation

• Folder Documentation

• Setup Guide

• Deployment Guide

• Changelog

• Release Notes

• Project Summary

------------------------------------------------------------

Architecture Agent

Responsible for understanding system design.

Capabilities

• Folder diagrams

• Authentication flow

• API flow

• Request lifecycle

• Database relationships

• Dependency graph

• Mermaid diagrams

------------------------------------------------------------

Project Manager Agent

Responsible for project planning.

Reads

• GitHub Issues

• Pull Requests

• Commit History

• TODO Comments

Generates

Daily Work Plan

Priority Tasks

Sprint Summary

Blocked Issues

Progress Report

------------------------------------------------------------

Search Agent

Responsible for semantic repository search.

Example

"Where is JWT verified?"

"Explain login flow."

"Find all authentication middleware."

"Show every API using bcrypt."

------------------------------------------------------------

## KNOWLEDGE ENGINE

Every AI Agent shares one common Knowledge Engine.

The Knowledge Engine is responsible for

Repository Parsing

Embedding Generation

Pinecone Search

Context Retrieval

Code Chunking

File References

Citation Building

This prevents duplicated logic across agents.

------------------------------------------------------------

## APPLICATION FLOW

User logs in.

↓

Connect GitHub Repository.

↓

GitHub OAuth.

↓

Repository Selection.

↓

Repository Analysis.

↓

Repository Parsing.

↓

Embedding Generation.

↓

Pinecone Indexing.

↓

Repository Summary Generation.

↓

Dashboard.

↓

User asks questions.

↓

Coordinator Agent.

↓

Knowledge Engine.

↓

Specialized Agent.

↓

LLM.

↓

Response.

------------------------------------------------------------

## PRIMARY FEATURES

GitHub OAuth Login

Repository Dashboard

Repository Search

AI Chat

Architecture Explorer

Documentation Generator

Project Manager Dashboard

Mermaid Diagram Generator

Code Viewer

Repository Health

Project Timeline

------------------------------------------------------------

## NON GOALS

Do NOT build another IDE.

Do NOT build another Cursor clone.

Do NOT generate random code.

Do NOT replace GitHub.

Do NOT replace VS Code.

RepoMind should focus only on Engineering Knowledge and Project Intelligence.

------------------------------------------------------------

## DESIGN PRINCIPLES

Clean

Minimal

Professional

Dark Theme

Glassmorphism

Smooth Animations

Fast

Responsive

Modern

Inspired by Linear, GitHub, Vercel and Cursor.

------------------------------------------------------------

## TECH STACK

Frontend

React

Vite

TailwindCSS

Framer Motion

Monaco Editor

Mermaid.js

React Flow

Axios

Backend

Node.js

Express

MongoDB Atlas

Pinecone

GitHub OAuth

Gemini 2.5 Flash

Gemini Embeddings

Tree-sitter

------------------------------------------------------------

## ARCHITECTURE

Use Modular Monolith.

Do NOT use

Docker

Redis

BullMQ

RabbitMQ

Kafka

Kubernetes

Microservices

Keep everything inside one backend and one frontend.

Separate business logic into Services and AI Agents.

------------------------------------------------------------

## FINAL GOAL

RepoMind should feel like an experienced Senior Software Engineer who has worked on the project since day one.

Instead of asking teammates,

developers should simply ask RepoMind.

RepoMind should understand the repository, explain architecture, generate documentation, suggest work priorities, and become the permanent engineering memory of every software project.

