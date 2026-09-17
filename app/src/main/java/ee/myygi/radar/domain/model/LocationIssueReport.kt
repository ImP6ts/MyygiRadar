package ee.myygi.radar.domain.model

enum class LocationIssueType(val displayName: String) {
    DOES_NOT_EXIST("Asukohta pole tegelikult olemas"),
    DUPLICATE("Duplikaat (sarnane asukoht on juba kaardil)"),
    INCORRECT_NAME("Vale nimi või eksitav kirjeldus"),
    INCORRECT_POSITION("Vale asukoht kaardil"),
    OTHER("Muu probleem")
}

data class LocationIssueReport(
    val id: String,
    val locationId: String,
    val locationName: String,
    val issueType: LocationIssueType,
    val description: String,
    val reportedBy: String,
    val reportedAt: Long,
    val status: String = "PENDING"
)
