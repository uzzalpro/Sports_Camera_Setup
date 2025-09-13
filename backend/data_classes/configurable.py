class Configurable:
    id_field = "id"
    model_fields = []

    def get_config_id(self):
        """This returns all field values of a configurable (detector/team_detector/field)

            Returns:
                dictionary of all fields and their value
        """

        return {
            "id": str(getattr(self, self.id_field)),
            "config": {
                field: getattr(self, field)
                for field in self.model_fields
            }
        }

    def update_config(self, data):
        """This updates all fields of a configurable (detector/team_detector/field)

            Args:
                dictionary of fields to update and their values
        """

        for field, value in data.items():
            if value is not None:
                setattr(self, field, value)
