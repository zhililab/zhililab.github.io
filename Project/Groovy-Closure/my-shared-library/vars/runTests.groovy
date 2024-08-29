def call(String project) {
    echo "Running tests for ${project}..."
    sh "mvn -f ${project}/pom.xml test"
}
