var helpers = {
    /**
     * Check string or array for a length greater than a passed number
     * Usage: {{#ifLengthierThan activationsGraphData 5}} ... {{else}} ... {{/ifLengthierThan}}
     */
    ifLengthierThan: function(obj, length)
    {
        var options = arguments[arguments.length - 1];
        if(obj.length > length)
        {
            return options.fn(this);
        } else
        {
            return options.inverse(this);
        }
    },

    /**
     * Mark selected option based on passed in status
     * From: http://stackoverflow.com/questions/13046401/how-to-set-selected-select-option-in-handlebars-template#18349787
     * Usage:
     * <select>
     *   {{#select status}}
     *   <option>Option 1</option>
     *   <option>Option 2</option>
     *   <option value="Option 3">Option 3 (extra info)</option>
     *   <option value="Option 4">Option 4 (more extra)</option>
     *   {{/select}}
     * </select>
     */
    select: function(value, options)
    {
        return options.fn(this)
            .replace(new RegExp(' value=\"' + value + '\"'),
                '$& selected="selected"')
            .replace(new RegExp('>' + value + '</option>'),
                ' selected="selected"$&');
    }
};

module.exports = helpers;
