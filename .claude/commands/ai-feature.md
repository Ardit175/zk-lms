# Skill: ai-feature

Kur thirret `/ai-feature [featureName] [description]`, implemento nje feature te re ne /ai-service duke ndjekur kete strukture:

## Struktura e Domosdoshme ne /ai-service

### 1. Router (`/ai-service/routers/[feature].py`)
```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services.[feature] import [Feature]Service

router = APIRouter(prefix="/[feature]", tags=["[feature]"])
service = [Feature]Service()

class [Feature]Request(BaseModel):
    # fushat e kerkuara

class [Feature]Response(BaseModel):
    # fushat e output-it
    success: bool
    data: dict

@router.post("/", response_model=[Feature]Response)
async def [feature]_endpoint(request: [Feature]Request):
    try:
        result = await service.process(request)
        return [Feature]Response(success=True, data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 2. Service (`/ai-service/services/[feature].py`)
```python
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import JsonOutputParser
import os

class [Feature]Service:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.7,
            api_key=os.getenv("OPENAI_API_KEY")
        )
    
    async def process(self, request):
        prompt = ChatPromptTemplate.from_messages([
            ("system", "System prompt ketu"),
            ("human", "{input}")
        ])
        
        chain = prompt | self.llm | JsonOutputParser()
        result = await chain.ainvoke({"input": request.field})
        return result
```

### 3. Regjistro ne main.py
```python
from routers.[feature] import router as [feature]_router
app.include_router([feature]_router, prefix="/api")
```

## Features te Para-Definuara per EduAI

### Quiz Generator
- Input: tekst/permbajtje kursi, numri pyetjeve, tipi (MULTIPLE_CHOICE/TRUE_FALSE/SHORT_ANSWER)
- Output: array pyetjesh me opsione dhe pergjigjen e sakte
- Prompt: gjeneroni pyetje akademike te qarta, te sakta, te niveleve te ndryshme (recall, comprehension, application)

### Content Summarizer  
- Input: permbajtja e nje lessoni (tekst i gjate)
- Output: permbledhje e shkurter (3-5 pika kryesore), fjalet kyce
- Perdorim: per SEO te kursit dhe preview per studente

### Feedback Generator
- Input: pergjigja e studentit ne nje detyre, kriteret e vleresimit
- Output: feedback konstruktiv, piket e sugjeruara, sugjerimet per permiresim
- Perdorim: ndihmon instruktorin te japë feedback me shpejt

## Rregulla te Detyrueshme
- GJITHMONE perdor `gpt-4o` si model (me i ri dhe me efikas)
- GJITHMONE perdor `ainvoke` (async) per performance me te mire
- GJITHMONE kthe JSON te strukturuar (perdor JsonOutputParser)
- GJITHMONE shto retry logic per OpenAI API calls (transient errors)
- GJITHMONE valido output-in e AI perpara se ta kthesh — AI mund te ktheje struktura te gabuara
- Temperature: 0.3 per quiz/faktorike, 0.7 per permbledhje/feedback kreativ
