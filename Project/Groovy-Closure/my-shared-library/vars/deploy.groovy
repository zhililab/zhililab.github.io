def call(String project, String environment) {
    echo "Deploying ${project} to ${environment}..."
    sh "scp target/${project}.war user@${environment}:/deploy/path/"
}
