package fi.espoo.evaka.vasu

import fi.espoo.evaka.shared.domain.DateRange
import org.jdbi.v3.json.Json
import java.util.UUID

data class VasuTemplate(
    val id: UUID,
    val name: String,
    val valid: DateRange,
    @Json
    val content: VasuContent
)

data class VasuTemplateSummary(
    val id: UUID,
    val name: String,
    val valid: DateRange,
    val documentCount: Int
)

val defaultTemplateContent = VasuContent(
    sections = emptyList()
)
