docker build -t ryanbreen/teslaui .
docker push ryanbreen/teslaui

# Identify the old task


# Grab id of the new task def
REGISTER_TASK_OUT=`aws ecs register-task-definition --cli-input-json file://teslaui.json --region us-east-1`
echo $REGISTER_TASK_OUT
ID=`echo $REGISTER_TASK_OUT | grep taskDefinitionArn | cut -d : -f 8 | cut -d \" -f 1`
aws ecs update-service --service teslaui --task-definition teslakinesis-ui:$ID
NEW_TASK_OUT=`aws ecs run-task --task-definition teslakinesis-ui:$ID --count 1 --region us-east-1`
echo $NEW_TASK_OUT
NEW_TASK_ARN=`echo $NEW_TASK_OUT | grep taskArn | head -n 1 | cut -d / -f 2 | cut -d \" -f 1`
echo "New task ARN is $NEW_TASK_ARN"

# Stop the old task once the new one is online