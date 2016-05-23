#!/bin/bash
cd ui
docker build -t ryanbreen/teslakinesis-ui .
until docker push ryanbreen/teslakinesis-ui; do echo "Docker push failed, trying again..."; sleep 1; done

cd ..
# Grab id of the new task def
ID=`aws --profile ryanbreen ecs register-task-definition --cli-input-json file://teslaui.json --region us-east-1 | grep taskDefinitionArn | cut -d : -f 8 | cut -d \" -f 1`
aws --profile ryanbreen ecs update-service --service teslaui --task-definition teslakinesis-ui:$ID
