def call(String project) {
    echo "Compiling ${project}..."
    sh "mvn -f ${project}/pom.xml clean install"
}
