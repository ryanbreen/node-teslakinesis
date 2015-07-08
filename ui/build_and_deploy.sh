#!/bin/bash
docker build -t ryanbreen/teslaui .
until docker push ryanbreen/teslaui; do echo "Docker push failed, trying again..."; done

# Grab id of the new task def
ID=`aws ecs register-task-definition --cli-input-json file://teslaui.json --region us-east-1 | grep taskDefinitionArn | cut -d : -f 8 | cut -d \" -f 1`
aws ecs update-service --service teslaui --task-definition teslakinesis-ui:$ID
