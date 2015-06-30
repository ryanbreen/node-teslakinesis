docker build -t ryanbreen/teslaui .
docker push ryanbreen/teslaui

# Identify the old task


# Grab id of the new task def
ID=`aws ecs register-task-definition --cli-input-json file://teslaui.json --region us-east-1 | grep taskDefinitionArn | cut -d : -f 8 | cut -d \" -f 1`
aws ecs update-service --service teslaui --task-definition teslakinesis-ui:$ID
aws ecs run-task --task-definition teslakinesis-ui:$ID --count 1 --region us-east-1

# Stop the old task once the new one is online